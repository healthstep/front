import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const auth = inject(AuthService);
  const router = inject(Router);

  const token = auth.getToken();
  if (token && auth.isJwtExpired(token)) {
    auth.clearAuth();
    return router.createUrlTree(['/auth']);
  }

  if (auth.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/auth']);
};
