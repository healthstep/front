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
import { TuiButton, TuiLoader, TuiTextfield } from '@taiga-ui/core';
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
  ],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <!-- Logo -->
        <div class="auth-header">
          <span class="logo-mark">❤️</span>
          <h1>ЗдравоШаг</h1>
          <p class="tagline">Следите за здоровьем — просто и бесплатно</p>
        </div>

        <!-- Token processing -->
        @if (tokenProcessing) {
          <div class="status-block">
            <tui-loader />
            <p>Выполняется вход...</p>
          </div>
        }

        @if (!tokenProcessing) {

          <!-- === Bot Auth === -->
          <div class="auth-section">
            <div class="section-label">
              <span class="section-num">1</span>
              Войти через мессенджер
            </div>
            <p class="hint">
              Откройте бота, поделитесь номером телефона — и вы в системе.
            </p>

            @if (loadingChallenge) {
              <div class="status-row">
                <tui-loader size="s" />
                <span>Подготовка ссылки...</span>
              </div>
            }

            @if (challengeError) {
              <div class="error-msg">{{ challengeError }}</div>
              <button tuiButton appearance="outline" size="s" (click)="retryChallenge()" style="margin-top:0.5rem">
                Попробовать снова
              </button>
            }

            @if (tgUrl && !authenticated) {
              <div class="bot-links">
                <a [href]="tgUrl" target="_blank" tuiButton appearance="primary" size="l">
                  ✈️ &nbsp;Telegram
                </a>
                @if (maxUrl) {
                  <a [href]="maxUrl" target="_blank" tuiButton appearance="secondary" size="l">
                    💬 &nbsp;MAX
                  </a>
                }
              </div>
              <div class="status-row muted">
                <tui-loader size="xs" />
                <span>Ожидание подтверждения...</span>
              </div>
            }
          </div>

          <!-- Divider -->
          <div class="divider"><span>или</span></div>

          <!-- === Password Auth === -->
          <div class="auth-section">
            <div class="section-label">
              <span class="section-num">2</span>
              Войти по паролю
            </div>
            <p class="hint">Номер телефона и пароль, полученный при регистрации через бота.</p>

            <form [formGroup]="loginForm" (ngSubmit)="loginWithPassword()" class="form">
              <div class="field">
                <label class="field-label">Телефон</label>
                <input
                  tuiTextfield
                  type="tel"
                  formControlName="phone"
                  placeholder="+7 999 000-00-00"
                  autocomplete="tel"
                  class="tui-input"
                />
                @if (loginForm.get('phone')?.touched && loginForm.get('phone')?.invalid) {
                  <span class="field-error">Введите номер в формате +7...</span>
                }
              </div>

              <div class="field">
                <label class="field-label">Пароль</label>
                <div class="pwd-wrap">
                  <input
                    tuiTextfield
                    [type]="showPassword ? 'text' : 'password'"
                    formControlName="password"
                    placeholder="Пароль"
                    autocomplete="current-password"
                    class="tui-input"
                  />
                  <button
                    type="button"
                    class="pwd-toggle"
                    (click)="showPassword = !showPassword"
                    tabindex="-1"
                  >{{ showPassword ? '🙈' : '👁️' }}</button>
                </div>
                @if (loginForm.get('password')?.touched && loginForm.get('password')?.invalid) {
                  <span class="field-error">Минимум 4 символа</span>
                }
              </div>

              @if (loginError) {
                <div class="error-msg">{{ loginError }}</div>
              }

              <button
                tuiButton
                appearance="primary"
                size="l"
                type="submit"
                [disabled]="loginLoading || loginForm.invalid"
                class="submit-btn"
              >
                @if (loginLoading) {
                  <tui-loader size="xs" />
                } @else {
                  Войти
                }
              </button>
            </form>
          </div>

          @if (authenticated) {
            <div class="success-block">
              <span>✅</span>
              <p>Авторизация прошла успешно! Перенаправление...</p>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      --brand: #2563eb;
      --brand-dark: #1d4ed8;
      --text: #0f172a;
      --text-muted: #64748b;
      --border: #e2e8f0;
    }

    .auth-page {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 2rem 1rem;
      background: linear-gradient(150deg, #eff6ff 0%, #e0f2fe 60%, #f0fdf4 100%);
    }

    .auth-card {
      max-width: 440px;
      width: 100%;
      background: white;
      border-radius: 1.25rem;
      box-shadow: 0 12px 48px rgba(37,99,235,0.12);
      overflow: hidden;
    }

    .auth-header {
      text-align: center;
      padding: 2.5rem 2rem 1.75rem;
      background: linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%);
      color: white;
    }

    .logo-mark {
      font-size: 2.5rem;
      display: block;
      margin-bottom: 0.5rem;
    }

    .auth-header h1 {
      margin: 0 0 0.25rem;
      font-size: 1.75rem;
      font-weight: 700;
    }

    .tagline {
      margin: 0;
      opacity: 0.8;
      font-size: 0.875rem;
    }

    .auth-section {
      padding: 1.75rem 2rem;
    }

    .section-label {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font-size: 1rem;
      font-weight: 600;
      color: var(--text);
      margin-bottom: 0.5rem;
    }

    .section-num {
      width: 1.5rem;
      height: 1.5rem;
      border-radius: 50%;
      background: var(--brand);
      color: white;
      font-size: 0.75rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .hint {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin: 0 0 1.25rem;
      line-height: 1.55;
    }

    .status-block {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      padding: 2rem;
      text-align: center;
      color: var(--text-muted);
      font-size: 0.9rem;
    }

    .status-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-top: 0.5rem;
    }

    .status-row.muted { justify-content: center; }

    .bot-links {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
    }

    .divider {
      display: flex;
      align-items: center;
      padding: 0 2rem;
      gap: 1rem;
      color: #94a3b8;
      font-size: 0.8rem;
    }

    .divider::before,
    .divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--border);
    }

    .form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .field-label {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .tui-input {
      width: 100%;
    }

    .pwd-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }

    .pwd-wrap .tui-input {
      padding-right: 2.5rem;
    }

    .pwd-toggle {
      position: absolute;
      right: 0.75rem;
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1rem;
      line-height: 1;
      padding: 0;
      color: var(--text-muted);
    }

    .field-error {
      font-size: 0.78rem;
      color: #dc2626;
    }

    .error-msg {
      font-size: 0.875rem;
      color: #dc2626;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 0.5rem;
      padding: 0.6rem 0.875rem;
    }

    .submit-btn { width: 100%; }

    .success-block {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1.25rem 2rem 1.5rem;
      font-size: 0.9rem;
      color: #15803d;
      font-weight: 500;
    }

    .success-block span { font-size: 1.25rem; }
    .success-block p { margin: 0; }
  `],
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
