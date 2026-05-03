import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  let raw = auth.getToken();
  if (raw && auth.isJwtExpired(raw)) {
    auth.clearAuth();
    raw = null;
  }
  const token = raw;

  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  const hadAuth = !!token;

  return next(req).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401 && hadAuth) {
        auth.clearAuth();
        if (!router.url.startsWith('/auth')) {
          void router.navigateByUrl('/auth');
        }
      }
      return throwError(() => err);
    }),
  );
};
