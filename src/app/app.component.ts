import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { TuiRoot } from '@taiga-ui/core';
import { AuthService, PENDING_AUTH_KEY } from './core/services/auth.service';
import { ApiService } from './core/services/api.service';
import { SeoService } from './core/seo/seo.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, TuiRoot],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  /** Поднимает SeoService (подписка на маршрут + первый снимок meta для роботов). */
  private readonly _seo = inject(SeoService);
  private readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    const t = this.auth.getToken();
    if (t && this.auth.isJwtExpired(t)) {
      this.auth.clearAuth();
    }
    this.redeemPendingAuth();
  }

  /**
   * Возврат из бота в мини-апп. Мини-апп открывается на лендинге, поэтому ключ
   * обмениваем на токен сразу при старте приложения (любая страница) и уводим в
   * ЛК — чтобы не нужно было жать «Начать», чтобы попасть на /auth.
   */
  private redeemPendingAuth(): void {
    if (!this.auth.isBrowser || this.auth.isAuthenticated()) return;
    let key: string | null = null;
    try {
      key = localStorage.getItem(PENDING_AUTH_KEY);
    } catch {
      return;
    }
    if (!key) return;
    this.api.checkAuthKey(key).subscribe({
      next: (res: { data?: { token?: string; user_id?: string } } | { token?: string; user_id?: string }) => {
        const d = (res as { data?: { token?: string; user_id?: string } }).data ?? (res as { token?: string; user_id?: string });
        if (d?.token) {
          try {
            localStorage.removeItem(PENDING_AUTH_KEY);
          } catch {
            /* noop */
          }
          this.auth.setAuth(d.token, d.user_id || '');
          this.router.navigateByUrl('/dashboard');
        }
      },
      error: () => {
        /* токен ещё не готов — оставим ключ, заберём в следующий раз */
      },
    });
  }
}
