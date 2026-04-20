import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';

const TOKEN_KEY = 'zdravoshag_token';
const USER_ID_KEY = 'zdravoshag_user_id';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);

  get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  getToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem(TOKEN_KEY);
  }

  getUserId(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem(USER_ID_KEY);
  }

  isAuthenticated(): boolean {
    const t = this.getToken();
    if (!t) return false;
    return !this.isJwtExpired(t);
  }

  /** Если токен похож на JWT и `exp` уже в прошлом — считаем сессию недействительной. */
  isJwtExpired(token: string): boolean {
    const exp = this.readJwtExp(token);
    if (exp == null) return false;
    const now = Math.floor(Date.now() / 1000);
    const skewSec = 30;
    return exp <= now + skewSec;
  }

  private readJwtExp(token: string): number | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const pad = b64.length % 4 ? '='.repeat(4 - (b64.length % 4)) : '';
      const json = JSON.parse(atob(b64 + pad)) as { exp?: number };
      return typeof json.exp === 'number' ? json.exp : null;
    } catch {
      return null;
    }
  }

  setAuth(token: string, userId: string): void {
    if (!this.isBrowser) return;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_ID_KEY, userId);
  }

  clearAuth(): void {
    if (!this.isBrowser) return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_ID_KEY);
  }

  logout(): void {
    this.clearAuth();
    this.router.navigateByUrl('/');
  }
}
