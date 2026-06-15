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
import { TuiButton, TuiLoader, TuiIcon, TuiTextfield, TuiInput, TuiLabel } from '@taiga-ui/core';
import { interval, Subscription } from 'rxjs';
import { switchMap, takeWhile } from 'rxjs/operators';

import { ApiService } from '../../core/services/api.service';
import { NavComponent } from '../../shared/nav/nav.component';
import { AuthService } from '../../core/services/auth.service';
import { WebsocketService, WsMessage } from '../../core/services/websocket.service';

/**
 * Ключ авторизационного челленджа, сохранённый между запусками. Нужен для
 * мини-аппа: пользователь уходит в бота (webview закрывается), бот кладёт токен
 * в Redis под этим ключом, а при повторном открытии мы его забираем.
 */
const PENDING_KEY = 'zdravoshag_pending_auth_key';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TuiButton,
    TuiLoader,
    TuiIcon,
    TuiTextfield,
    TuiInput,
    TuiLabel,
    NavComponent,
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
  /** Показываем «Ожидание подтверждения» только после перехода в мессенджер */
  messengerOpened = false;

  loginForm = this.fb.group({
    phone: ['', [Validators.required, Validators.pattern(/^\+\d{10,15}$/)]],
    password: ['', [Validators.required, Validators.minLength(4)]],
  });

  private wsSub: Subscription | null = null;
  private pollSub: Subscription | null = null;
  /** Текущий ключ челленджа (для быстрой проверки при возврате в окно). */
  private currentKey: string | null = null;

  /** При возврате в мини-апп (бот → снова сайт) сразу пробуем забрать токен. */
  private readonly onVisible = (): void => {
    if (this.authenticated) return;
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
    const key = this.currentKey || (this.auth.isBrowser ? localStorage.getItem(PENDING_KEY) : null);
    if (key) this.redeemKey(key, false);
  };

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) {
      this.router.navigateByUrl('/dashboard');
      return;
    }

    // All auth flows require the browser — skip entirely during SSR.
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    document.addEventListener('visibilitychange', this.onVisible);

    const token = this.route.snapshot.queryParamMap.get('token');
    if (token) {
      this.processOneTimeToken(token);
      return;
    }

    // Возврат из бота в мини-апп: если остался ключ с прошлого запуска —
    // токен уже мог появиться, пробуем забрать его, не открывая бота заново.
    const pending = localStorage.getItem(PENDING_KEY);
    if (pending) {
      this.redeemKey(pending, true);
      return;
    }

    this.startChallenge();
  }

  ngOnDestroy(): void {
    this.ws.disconnect();
    this.wsSub?.unsubscribe();
    this.pollSub?.unsubscribe();
    if (isPlatformBrowser(this.platformId)) {
      document.removeEventListener('visibilitychange', this.onVisible);
    }
  }

  /**
   * Пробует обменять сохранённый ключ на токен. Если токена ещё нет и
   * startFresh=true — запускает новый челлендж (первый вход).
   */
  private redeemKey(key: string, startFresh: boolean): void {
    if (startFresh) this.loadingChallenge = true;
    this.api.checkAuthKey(key).subscribe({
      next: (res: any) => {
        const d = res.data || res;
        if (d?.token) {
          this.finishAuth(d.token, d.user_id || '');
        } else if (startFresh) {
          this.startChallenge();
        }
      },
      error: () => {
        if (startFresh) this.startChallenge();
      },
    });
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
    this.tgUrl = null;
    this.maxUrl = null;
    this.messengerOpened = false;
    this.pollSub?.unsubscribe();

    this.api.browserChallenge().subscribe({
      next: (res: any) => {
        this.loadingChallenge = false;
        const data = res.data || res;
        this.tgUrl = data.tg_bot_url;
        this.maxUrl = data.max_bot_url;
        this.currentKey = data.key;
        // Запоминаем ключ, чтобы забрать токен после возврата из бота
        // (в мини-аппе webview закрывается и теряет состояние в памяти).
        try {
          localStorage.setItem(PENDING_KEY, data.key);
        } catch {
          /* приватный режим — переживём без персиста */
        }

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
    this.messengerOpened = false;
    this.startChallenge();
  }

  onMessengerOpened(): void {
    this.messengerOpened = true;
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
    try {
      localStorage.removeItem(PENDING_KEY);
    } catch {
      /* noop */
    }
    setTimeout(() => this.router.navigateByUrl('/dashboard'), 600);
  }
}
