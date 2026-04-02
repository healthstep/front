import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TuiButton } from '@taiga-ui/core';

import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, TuiButton],
  template: `
    <div class="dashboard">
      <header class="dash-header">
        <h1>Личный кабинет</h1>
        <button tuiButton appearance="secondary" size="s" (click)="logout()">Выйти</button>
      </header>

      @if (user) {
        <section class="user-info">
          <h2>{{ user.display_name || 'Пользователь' }}</h2>
          <p class="phone">{{ user.phone_e164 }}</p>
        </section>
      }

      @if (dashboard) {
        <section class="progress-section">
          <h2>Прогресс</h2>
          <div class="level-info">
            <span class="level-name">{{ levelName(dashboard.level) }}</span>
            <span class="level-pct">{{ dashboard.progress_percent | number:'1.0-0' }}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" [style.width.%]="dashboard.progress_percent"></div>
          </div>
          <div class="stats">
            <div class="stat">
              <span class="stat-val">{{ dashboard.total_criteria }}</span>
              <span class="stat-label">Всего</span>
            </div>
            <div class="stat">
              <span class="stat-val">{{ dashboard.filled_criteria }}</span>
              <span class="stat-label">Заполнено</span>
            </div>
            <div class="stat">
              <span class="stat-val">{{ dashboard.overdue_criteria }}</span>
              <span class="stat-label">Просрочено</span>
            </div>
          </div>
        </section>

        @if (dashboard.states?.length) {
          <section class="criteria-section">
            <h2>Чеклист здоровья</h2>
            <div class="criteria-list">
              @for (state of dashboard.states; track state.criterion_id) {
                <div class="criterion-item">
                  <span class="criterion-status">{{ statusIcon(state.status) }}</span>
                  <div class="criterion-info">
                    <span class="criterion-name">{{ state.criterion_name }}</span>
                    @if (state.last_value_summary) {
                      <span class="criterion-value">{{ state.last_value_summary }}</span>
                    }
                  </div>
                </div>
              }
            </div>
          </section>
        }
      }

      @if (loading) {
        <p class="loading-text">Загрузка данных...</p>
      }
    </div>
  `,
  styles: [`
    .dashboard {
      max-width: 720px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }

    .dash-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .user-info {
      margin-bottom: 2rem;
    }

    .phone {
      opacity: 0.6;
    }

    .progress-section {
      margin-bottom: 2rem;
    }

    .level-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .level-name {
      font-weight: 600;
      font-size: 1.1rem;
    }

    .level-pct {
      opacity: 0.7;
    }

    .progress-bar {
      height: 10px;
      border-radius: 5px;
      background: var(--tui-border-normal);
      overflow: hidden;
      margin-bottom: 1.5rem;
    }

    .progress-fill {
      height: 100%;
      border-radius: 5px;
      background: var(--tui-status-positive);
      transition: width 0.3s ease;
    }

    .stats {
      display: flex;
      gap: 2rem;
    }

    .stat {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .stat-val {
      font-size: 1.5rem;
      font-weight: 700;
    }

    .stat-label {
      opacity: 0.6;
      font-size: 0.85rem;
    }

    .criteria-section h2 {
      margin-bottom: 1rem;
    }

    .criteria-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .criterion-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border-radius: 0.75rem;
      border: 1px solid var(--tui-border-normal);
    }

    .criterion-status {
      font-size: 1.2rem;
    }

    .criterion-info {
      display: flex;
      flex-direction: column;
    }

    .criterion-name {
      font-weight: 500;
    }

    .criterion-value {
      font-size: 0.85rem;
      opacity: 0.6;
    }

    .loading-text {
      text-align: center;
      opacity: 0.5;
      margin-top: 3rem;
    }
  `],
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  user: any = null;
  dashboard: any = null;
  loading = true;

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.api.getMe().subscribe({
      next: (res: any) => (this.user = res.data || res),
      error: () => {},
    });

    this.api.getDashboard().subscribe({
      next: (res: any) => {
        this.dashboard = res.data || res;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  levelName(level: string): string {
    const names: Record<string, string> = {
      normie: '🟢 Нормис',
      overachiever: '🟡 Сын маминой подруги',
      full_control: '🔥 Гига чад',
    };
    return names[level] || level;
  }

  statusIcon(status: string): string {
    const icons: Record<string, string> = {
      ok: '✅',
      overdue: '⚠️',
      missing: '🔴',
      warning: '⚠️',
    };
    return icons[status] || '⬜';
  }

  logout(): void {
    this.auth.logout();
  }
}
