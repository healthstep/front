import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, Subject, timer } from 'rxjs';
import { retryWhen, tap, delayWhen } from 'rxjs/operators';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { environment } from '../../environments/environment';

export interface WsMessage {
  type: string;
  token?: string;
  user_id?: string;
  [key: string]: any;
}

@Injectable({ providedIn: 'root' })
export class WebsocketService {
  private platformId = inject(PLATFORM_ID);
  private socket$: WebSocketSubject<WsMessage> | null = null;
  private messages$ = new Subject<WsMessage>();
  private retryAttempt = 0;

  connect(key: string): Observable<WsMessage> {
    if (!isPlatformBrowser(this.platformId)) {
      return this.messages$.asObservable();
    }

    const url = `${environment.wsUrl}?key=${key}`;
    this.socket$ = webSocket<WsMessage>({ url });

    this.socket$
      .pipe(
        retryWhen(errors =>
          errors.pipe(
            tap(() => this.retryAttempt++),
            delayWhen(() => timer(Math.min(1000 * Math.pow(2, this.retryAttempt), 30000))),
          ),
        ),
      )
      .subscribe({
        next: msg => this.messages$.next(msg),
        error: err => this.messages$.error(err),
      });

    return this.messages$.asObservable();
  }

  disconnect(): void {
    this.socket$?.complete();
    this.socket$ = null;
    this.retryAttempt = 0;
  }
}
