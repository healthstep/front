import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { TuiButton, TuiLoader, TuiTextfield, TuiIcon } from '@taiga-ui/core';
import { interval, Subscription } from 'rxjs';
import { switchMap, takeWhile } from 'rxjs/operators';

import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { WebsocketService, WsMessage } from '../../core/services/websocket.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TuiButton,
    TuiLoader,
    TuiTextfield,
    TuiIcon,
  ],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss',
})
export class AuthComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private ws = inject(WebsocketService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private platformId = inject(PLATFORM_ID);
  private fb = inject(FormBuilder);

  loadingChallenge = false;
  tgUrl: string | null = null;
  maxUrl: string | null = null;
  authenticated = false;
  challengeError: string | null = null;
  tokenProcessing = false;
  showPassword = false;

  loginLoading = false;
  loginError: string | null = null;

  loginForm = this.fb.group({
    phone: ['', [Validators.required, Validators.pattern(/^\+\d{10,15}$/)]],
    password: ['', [Validators.required, Validators.minLength(4)]],
  });

  private wsSub: Subscription | null = null;
  private pollSub: Subscription | null = null;

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) {
      this.router.navigateByUrl('/dashboard');
      return;
    }

    if (isPlatformBrowser(this.platformId)) {
      const token = this.route.snapshot.queryParamMap.get('token');
      if (token) {
        this.processOneTimeToken(token);
        return;
      }
    }

    this.startChallenge();
  }

  ngOnDestroy(): void {
    this.ws.disconnect();
    this.wsSub?.unsubscribe();
    this.pollSub?.unsubscribe();
  }

  processOneTimeToken(token: string): void {
    this.tokenProcessing = true;
    this.auth.setAuth(token, '');
    this.api.getMe().subscribe({
      next: (res: any) => {
        const data = res.data || res;
        this.auth.setAuth(token, data.id || '');
        this.tokenProcessing = false;
        this.router.navigateByUrl('/dashboard');
      },
      error: () => {
        this.auth.clearAuth();
        this.tokenProcessing = false;
        this.startChallenge();
      },
    });
  }

  startChallenge(): void {
    this.loadingChallenge = true;
    this.challengeError = null;
    this.pollSub?.unsubscribe();

    this.api.browserChallenge().subscribe({
      next: (res: any) => {
        this.loadingChallenge = false;
        const data = res.data || res;
        this.tgUrl = data.tg_bot_url;
        this.maxUrl = data.max_bot_url;

        if (isPlatformBrowser(this.platformId)) {
          // Primary: WebSocket
          this.wsSub = this.ws.connect(data.key).subscribe({
            next: (msg: WsMessage) => {
              if (msg.type === 'auth' && msg.token) {
                this.finishAuth(msg.token, msg.user_id || '');
              }
            },
          });

          // Fallback: poll every 3 s
          this.pollSub = interval(3000)
            .pipe(
              switchMap(() => this.api.checkAuthKey(data.key)),
              takeWhile(() => !this.authenticated, true),
            )
            .subscribe({
              next: (pollRes: any) => {
                const d = pollRes.data || pollRes;
                if (d?.token) {
                  this.finishAuth(d.token, d.user_id || '');
                }
              },
            });
        }
      },
      error: () => {
        this.loadingChallenge = false;
        this.challengeError = 'Не удалось создать ссылку для авторизации';
      },
    });
  }

  retryChallenge(): void {
    this.ws.disconnect();
    this.wsSub?.unsubscribe();
    this.pollSub?.unsubscribe();
    this.tgUrl = null;
    this.maxUrl = null;
    this.startChallenge();
  }

  loginWithPassword(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { phone, password } = this.loginForm.value;
    this.loginLoading = true;
    this.loginError = null;

    this.api.loginWithPassword(phone!, password!).subscribe({
      next: (res: any) => {
        const data = res.data || res;
        this.loginLoading = false;
        if (data?.token) {
          this.finishAuth(data.token, data.user_id || '');
        } else {
          this.loginError = 'Неверный номер телефона или пароль';
        }
      },
      error: (err: any) => {
        this.loginLoading = false;
        const msg = err?.error?.message || err?.error?.error;
        this.loginError = msg || 'Неверный номер телефона или пароль';
      },
    });
  }

  private finishAuth(token: string, userId: string): void {
    if (this.authenticated) return;
    this.authenticated = true;
    this.auth.setAuth(token, userId);
    this.ws.disconnect();
    this.pollSub?.unsubscribe();
    setTimeout(() => this.router.navigateByUrl('/dashboard'), 600);
  }
}
