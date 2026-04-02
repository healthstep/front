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
    return !!this.getToken();
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
