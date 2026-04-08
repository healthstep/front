import { Component, OnInit, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TuiButton } from '@taiga-ui/core';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TuiButton, CommonModule],
  template: `
    <nav class="navbar">
      <div class="nav-brand">
        <span class="nav-logo">🏥</span>
        <span class="nav-title">ЗдравоШаг</span>
      </div>
      <div class="nav-links">
        <a routerLink="/dashboard" routerLinkActive="active" class="nav-link">
          📊 Прогресс
        </a>
        <a routerLink="/profile" routerLinkActive="active" class="nav-link">
          👤 Профиль
        </a>
        <a *ngIf="isAdmin" routerLink="/admin" routerLinkActive="active" class="nav-link admin-link">
          ⚙️ Админ
        </a>
      </div>
      <button tuiButton appearance="ghost" size="s" (click)="logout()">Выйти</button>
    </nav>
  `,
  styles: [`
    .navbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1.5rem;
      background: white;
      border-bottom: 1px solid #e2e8f0;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }

    .nav-brand {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      text-decoration: none;
    }

    .nav-logo { font-size: 1.5rem; }

    .nav-title {
      font-weight: 700;
      font-size: 1.1rem;
      color: #0f172a;
    }

    .nav-links {
      display: flex;
      gap: 0.25rem;
    }

    .nav-link {
      padding: 0.5rem 0.75rem;
      border-radius: 0.5rem;
      text-decoration: none;
      color: #64748b;
      font-size: 0.9rem;
      transition: all 0.15s;
    }

    .nav-link:hover { background: #f1f5f9; color: #0f172a; }

    .nav-link.active {
      background: #e0f2fe;
      color: #0284c7;
      font-weight: 600;
    }

    .admin-link.active { background: #fef3c7; color: #92400e; }
  `],
})
export class NavComponent implements OnInit {
  private auth = inject(AuthService);
  private api = inject(ApiService);

  isAdmin = false;

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) {
      this.api.getMe().subscribe({
        next: (res: any) => {
          const u = res.data || res;
          this.isAdmin = u?.is_admin === true;
        },
        error: () => {},
      });
    }
  }

  logout(): void {
    this.auth.logout();
  }
}
