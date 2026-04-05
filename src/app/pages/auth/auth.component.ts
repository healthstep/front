import { Component, OnInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TuiButton, TuiLoader, TuiTextfield } from '@taiga-ui/core';
import { Subscription } from 'rxjs';

import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { WebsocketService, WsMessage } from '../../core/services/websocket.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, TuiButton, TuiLoader, FormsModule, TuiTextfield],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-logo">
          <span class="logo-icon">🏥</span>
          <h1>ЗдравоШаг</h1>
          <p class="tagline">Следите за здоровьем вместе с нами</p>
        </div>

        @if (tokenProcessing) {
          <div class="token-processing">
            <tui-loader />
            <p>Выполняется вход...</p>
          </div>
        }

        @if (!tokenProcessing) {
          <!-- Bot Auth -->
          <div class="auth-section">
            <h2>Войти через мессенджер</h2>
            <p class="auth-desc">
              Откройте бота в Telegram или MAX, поделитесь номером телефона — и вы в системе.
            </p>

            @if (loadingChallenge) {
              <tui-loader class="loader" />
              <p class="auth-status">Подготовка ссылки...</p>
            }

            @if (tgUrl && !authenticated) {
              <div class="bot-links">
                <a [href]="tgUrl" target="_blank" tuiButton appearance="primary" size="l">
                  📱 Открыть в Telegram
                </a>
                <a [href]="maxUrl" target="_blank" tuiButton appearance="secondary" size="l">
                  💬 Открыть в MAX
                </a>
              </div>
              <div class="waiting">
                <tui-loader size="xs" />
                <span>Ожидание подтверждения через бота...</span>
              </div>
            }
          </div>

          <div class="divider">
            <span>или</span>
          </div>

          <!-- Phone+Password Auth -->
          <div class="auth-section">
            <h2>Войти по паролю</h2>
            <p class="auth-desc">Используйте номер телефона и пароль из приложения.</p>

            <div class="form-group">
              <input
                tuiTextfield
                type="tel"
                placeholder="+7 999 000-00-00"
                [(ngModel)]="phone"
                class="auth-input"
              />
              <input
                tuiTextfield
                type="password"
                placeholder="Пароль"
                [(ngModel)]="password"
                class="auth-input"
              />
              <button
                tuiButton
                appearance="primary"
                size="l"
                [disabled]="loginLoading"
                (click)="loginWithPassword()"
                class="submit-btn"
              >
                @if (loginLoading) {
                  <tui-loader size="xs" />
                } @else {
                  Войти
                }
              </button>
            </div>

            @if (loginError) {
              <p class="auth-error">{{ loginError }}</p>
            }
          </div>

          @if (authenticated) {
            <p class="auth-success">✅ Авторизация успешна! Перенаправление...</p>
          }

          @if (challengeError) {
            <p class="auth-error">{{ challengeError }}</p>
            <button tuiButton appearance="secondary" (click)="retryChallenge()">
              Попробовать снова
            </button>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 2rem;
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    }

    .auth-card {
      max-width: 440px;
      width: 100%;
      background: white;
      border-radius: 1.5rem;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
      overflow: hidden;
    }

    .auth-logo {
      text-align: center;
      padding: 2.5rem 2rem 1.5rem;
      background: linear-gradient(135deg, #0ea5e9, #0284c7);
      color: white;
    }

    .logo-icon {
      font-size: 3rem;
      display: block;
      margin-bottom: 0.5rem;
    }

    .auth-logo h1 {
      margin: 0 0 0.25rem;
      font-size: 1.75rem;
      font-weight: 700;
    }

    .tagline {
      margin: 0;
      opacity: 0.85;
      font-size: 0.9rem;
    }

    .auth-section {
      padding: 1.5rem 2rem;
    }

    .auth-section h2 {
      font-size: 1rem;
      font-weight: 600;
      margin: 0 0 0.5rem;
      color: #1e293b;
    }

    .auth-desc {
      opacity: 0.6;
      font-size: 0.875rem;
      margin: 0 0 1rem;
      line-height: 1.5;
    }

    .bot-links {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .waiting {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      opacity: 0.6;
      font-size: 0.8rem;
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
      background: #e2e8f0;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .auth-input {
      width: 100%;
    }

    .submit-btn {
      width: 100%;
    }

    .auth-success {
      color: #16a34a;
      font-weight: 600;
      text-align: center;
      padding: 1rem 2rem;
    }

    .auth-error {
      color: #dc2626;
      font-size: 0.875rem;
      margin: 0.5rem 0 0;
      text-align: center;
    }

    .loader {
      margin-bottom: 0.5rem;
    }

    .auth-status {
      opacity: 0.6;
      text-align: center;
      font-size: 0.875rem;
    }

    .token-processing {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 3rem 2rem;
      text-align: center;
    }
  `],
})
export class AuthComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private ws = inject(WebsocketService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private platformId = inject(PLATFORM_ID);

  loadingChallenge = false;
  tgUrl: string | null = null;
  maxUrl: string | null = null;
  authenticated = false;
  challengeError: string | null = null;

  // Phone + password login
  phone = '';
  password = '';
  loginLoading = false;
  loginError: string | null = null;

  // One-time token from URL
  tokenProcessing = false;

  private wsSub: Subscription | null = null;

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) {
      this.router.navigateByUrl('/dashboard');
      return;
    }

    // Check for one-time token in URL query params.
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
  }

  /** Handles the one-time login token sent in the bot notification link. */
  processOneTimeToken(token: string): void {
    this.tokenProcessing = true;
    // Validate the token via API, then store it.
    this.api.getMe().subscribe({
      next: (res: any) => {
        const data = res.data || res;
        this.auth.setAuth(token, data.id || '');
        this.tokenProcessing = false;
        this.router.navigateByUrl('/dashboard');
      },
      error: () => {
        // Token invalid or expired, fall through to normal auth.
        this.tokenProcessing = false;
        this.startChallenge();
      },
    });

    // Store the token temporarily to use in the API call.
    this.auth.setAuth(token, '');
  }

  startChallenge(): void {
    this.loadingChallenge = true;
    this.challengeError = null;

    this.api.browserChallenge().subscribe({
      next: (res: any) => {
        this.loadingChallenge = false;
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
        this.loadingChallenge = false;
        this.challengeError = 'Не удалось создать ссылку для авторизации';
      },
    });
  }

  retryChallenge(): void {
    this.ws.disconnect();
    this.wsSub?.unsubscribe();
    this.startChallenge();
  }

  loginWithPassword(): void {
    if (!this.phone || !this.password) {
      this.loginError = 'Введите номер телефона и пароль';
      return;
    }
    this.loginLoading = true;
    this.loginError = null;

    // Phone+password login is not yet implemented on the backend.
    // TODO: implement when backend /auth/login endpoint is ready.
    setTimeout(() => {
      this.loginLoading = false;
      this.loginError = 'Вход по паролю временно недоступен. Используйте вход через мессенджер.';
    }, 500);
  }
}
