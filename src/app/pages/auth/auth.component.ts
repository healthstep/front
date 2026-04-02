import { Component, OnInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { TuiButton, TuiLoader } from '@taiga-ui/core';
import { Subscription } from 'rxjs';

import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { WebsocketService, WsMessage } from '../../core/services/websocket.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, TuiButton, TuiLoader],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <h1>Авторизация</h1>
        <p class="auth-desc">
          Войдите через мессенджер. Откройте бота, поделитесь номером телефона — и вы в системе.
        </p>

        @if (loading) {
          <tui-loader class="loader" />
          <p class="auth-status">Генерация ссылки...</p>
        }

        @if (tgUrl && !authenticated) {
          <div class="bot-links">
            <a [href]="tgUrl" target="_blank" tuiButton appearance="primary" size="l">
              Открыть в Telegram
            </a>
            <a [href]="maxUrl" target="_blank" tuiButton appearance="secondary" size="l">
              Открыть в MAX
            </a>
          </div>
          <div class="waiting">
            <tui-loader size="s" />
            <span>Ожидание авторизации через бота...</span>
          </div>
        }

        @if (authenticated) {
          <p class="auth-success">Авторизация успешна! Перенаправление...</p>
        }

        @if (error) {
          <p class="auth-error">{{ error }}</p>
          <button tuiButton appearance="secondary" (click)="retry()">Попробовать снова</button>
        }
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 80vh;
      padding: 2rem;
    }

    .auth-card {
      max-width: 420px;
      width: 100%;
      text-align: center;
      padding: 3rem 2rem;
      border-radius: 1.5rem;
      border: 1px solid var(--tui-border-normal);
    }

    h1 {
      margin-bottom: 0.5rem;
    }

    .auth-desc {
      opacity: 0.7;
      margin-bottom: 2rem;
      line-height: 1.5;
    }

    .bot-links {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 2rem;
    }

    .waiting {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      opacity: 0.6;
      font-size: 0.9rem;
    }

    .auth-success {
      color: var(--tui-status-positive);
      font-weight: 600;
    }

    .auth-error {
      color: var(--tui-status-negative);
      margin-bottom: 1rem;
    }

    .loader {
      margin-bottom: 1rem;
    }

    .auth-status {
      opacity: 0.6;
    }
  `],
})
export class AuthComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private ws = inject(WebsocketService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  loading = false;
  tgUrl: string | null = null;
  maxUrl: string | null = null;
  authenticated = false;
  error: string | null = null;

  private wsSub: Subscription | null = null;

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) {
      this.router.navigateByUrl('/dashboard');
      return;
    }
    this.startChallenge();
  }

  ngOnDestroy(): void {
    this.ws.disconnect();
    this.wsSub?.unsubscribe();
  }

  startChallenge(): void {
    this.loading = true;
    this.error = null;

    this.api.browserChallenge().subscribe({
      next: (res: any) => {
        this.loading = false;
        const data = res.data || res;
        this.tgUrl = data.tg_bot_url;
        this.maxUrl = data.max_bot_url;

        if (isPlatformBrowser(this.platformId)) {
          this.wsSub = this.ws.connect(data.key).subscribe({
            next: (msg: WsMessage) => {
              if (msg.type === 'auth' && msg.token) {
                this.auth.setAuth(msg.token, msg.user_id || '');
                this.authenticated = true;
                this.ws.disconnect();
                setTimeout(() => this.router.navigateByUrl('/dashboard'), 500);
              }
            },
          });
        }
      },
      error: () => {
        this.loading = false;
        this.error = 'Не удалось создать ссылку для авторизации';
      },
    });
  }

  retry(): void {
    this.ws.disconnect();
    this.wsSub?.unsubscribe();
    this.startChallenge();
  }
}
