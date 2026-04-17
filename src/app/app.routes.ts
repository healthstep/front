import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import type { SeoRouteData } from './core/seo/seo.types';

const SEO_HOME: SeoRouteData = {
  title: 'ЗОШ — шаг за шагом к здоровью | учёт показателей и рекомендаций',
  description:
    'ЗОШ помогает вести показатели здоровья по группам, получать персональные рекомендации и видеть прогресс. Вход через мессенджер или пароль.',
  robots: 'index, follow',
  ogType: 'website',
  jsonLd: true,
};

const SEO_AUTH: SeoRouteData = {
  title: 'Вход | ЗОШ',
  description: 'Авторизация в сервисе ЗОШ через Telegram, MAX или по паролю.',
  robots: 'noindex, nofollow',
  ogType: 'website',
};

const SEO_APP: SeoRouteData = {
  title: 'Личный кабинет | ЗОШ',
  description: 'Прогресс и настройки профиля в сервисе ЗОШ. Доступно после входа.',
  robots: 'noindex, nofollow',
  ogType: 'website',
};

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/landing/landing.component').then(m => m.LandingComponent),
    data: { seo: SEO_HOME },
  },
  {
    path: 'auth',
    loadComponent: () =>
      import('./pages/auth/auth.component').then(m => m.AuthComponent),
    data: { seo: SEO_AUTH },
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard],
    data: { seo: { ...SEO_APP, title: 'Прогресс | ЗОШ' } },
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./pages/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuard],
    data: { seo: { ...SEO_APP, title: 'Профиль | ЗОШ' } },
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./pages/admin/admin.component').then(m => m.AdminComponent),
    canActivate: [authGuard],
    data: { seo: { ...SEO_APP, title: 'Администрирование | ЗОШ' } },
  },
  { path: '**', redirectTo: '' },
];
