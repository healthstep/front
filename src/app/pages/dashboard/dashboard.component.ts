import { Component, OnInit, AfterViewInit, inject, ElementRef, ViewChild, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TuiButton, TuiLoader, TuiTextfield } from '@taiga-ui/core';
import { NavComponent } from '../../shared/nav/nav.component';
import { ApiService } from '../../core/services/api.service';

interface CriterionEntry {
  criterion_id: string;
  criterion_name: string;
  analysis_id: string;
  analysis_name: string;
  value: string;
  status: string;
  recommendation: string;
  level: number;
  severity: string;
}

interface Recommendation {
  criterion_id: string;
  criterion_name: string;
  analysis_name: string;
  text: string;
  severity: string;
}

interface AnalysisGroup {
  name: string;
  entries: CriterionEntry[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, TuiButton, TuiLoader, NavComponent, FormsModule, TuiTextfield],
  template: `
    <app-nav />
    <div class="page">

      <!-- Progress Summary -->
      <section class="card progress-card" *ngIf="progress">
        <div class="progress-header">
          <div>
            <h2 class="section-title">📊 Мой прогресс</h2>
            <p class="level-label">{{ progress.level_label }}</p>
          </div>
          <div class="progress-stats">
            <div class="stat">
              <span class="stat-num">{{ progress.filled }}</span>
              <span class="stat-lbl">заполнено</span>
            </div>
            <div class="stat-sep">/</div>
            <div class="stat">
              <span class="stat-num">{{ progress.total }}</span>
              <span class="stat-lbl">всего</span>
            </div>
          </div>
        </div>
        <div class="progress-bar-track">
          <div class="progress-bar-fill" [style.width.%]="progress.percent"></div>
        </div>
        <span class="progress-pct">{{ progress.percent | number:'1.0-0' }}%</span>
      </section>

      <!-- Chart -->
      <section class="card chart-card">
        <h2 class="section-title">📈 Визуализация здоровья</h2>
        <canvas #healthChart class="chart-canvas"></canvas>
      </section>

      <!-- Recommendations -->
      <section class="card" *ngIf="recommendations?.length">
        <h2 class="section-title">💡 Рекомендации</h2>
        <div class="rec-list">
          <div *ngFor="let r of recommendations" class="rec-item" [class]="'rec-' + r.severity">
            <span class="rec-icon">{{ severityEmoji(r.severity) }}</span>
            <div class="rec-body">
              <p class="rec-criterion">{{ r.criterion_name }}
                <span class="rec-analysis" *ngIf="r.analysis_name">({{ r.analysis_name }})</span>
              </p>
              <p class="rec-text">{{ r.text }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Health Criteria Table -->
      <section class="card criteria-card">
        <h2 class="section-title">🔬 Показатели здоровья</h2>

        @if (loading) {
          <tui-loader />
        }

        @if (!loading && analysisGroups.length === 0) {
          <p class="empty">Нет данных. Добавьте первые показатели через бота.</p>
        }

        @for (group of analysisGroups; track group.name) {
          <div class="analysis-group">
            <h3 class="analysis-name">{{ group.name }}</h3>
            <table class="criteria-table">
              <thead>
                <tr>
                  <th>Показатель</th>
                  <th>Уровень</th>
                  <th>Значение</th>
                  <th>Статус</th>
                  <th>Рекомендация</th>
                </tr>
              </thead>
              <tbody>
                @for (entry of group.entries; track entry.criterion_id) {
                  <tr class="criterion-row" [class]="'row-' + entry.status">
                    <td class="criterion-name-cell">{{ entry.criterion_name }}</td>
                    <td class="level-cell">
                      <span class="level-badge" [class]="'level-' + entry.level">
                        {{ levelLabel(entry.level) }}
                      </span>
                    </td>
                    <td class="value-cell">
                      @if (editingId === entry.criterion_id) {
                        <div class="inline-edit">
                          <input
                            tuiTextfield
                            [(ngModel)]="editValue"
                            type="text"
                            size="s"
                            class="edit-input"
                            (keyup.enter)="saveValue(entry)"
                          />
                          <button tuiButton size="xs" appearance="primary" (click)="saveValue(entry)">✓</button>
                          <button tuiButton size="xs" appearance="ghost" (click)="cancelEdit()">✗</button>
                        </div>
                      } @else {
                        <span class="value-text" *ngIf="entry.value; else noValue">{{ entry.value }}</span>
                        <ng-template #noValue><span class="no-value">—</span></ng-template>
                        <button tuiButton size="xs" appearance="ghost" (click)="startEdit(entry)" class="edit-btn">
                          ✏️
                        </button>
                      }
                    </td>
                    <td class="status-cell">
                      <span class="status-badge" [class]="'status-' + entry.status">
                        {{ statusEmoji(entry.status) }} {{ statusLabel(entry.status) }}
                      </span>
                    </td>
                    <td class="rec-cell">
                      <span class="rec-tip" *ngIf="entry.recommendation">{{ entry.recommendation }}</span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </section>
    </div>
  `,
  styles: [`
    .page {
      max-width: 900px;
      margin: 0 auto;
      padding: 1.5rem 1rem 3rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .card {
      background: white;
      border-radius: 1rem;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }

    .section-title {
      font-size: 1.1rem;
      font-weight: 700;
      margin: 0 0 1rem;
      color: #0f172a;
    }

    /* Progress */
    .progress-card { }

    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }

    .level-label {
      color: #64748b;
      font-size: 0.9rem;
      margin: 0.25rem 0 0;
    }

    .progress-stats {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .stat { display: flex; flex-direction: column; align-items: center; }
    .stat-num { font-size: 1.75rem; font-weight: 700; color: #0284c7; }
    .stat-lbl { font-size: 0.75rem; color: #94a3b8; }
    .stat-sep { font-size: 1.5rem; color: #cbd5e1; }

    .progress-bar-track {
      height: 12px;
      background: #e2e8f0;
      border-radius: 6px;
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #0ea5e9, #0284c7);
      border-radius: 6px;
      transition: width 0.5s ease;
    }

    .progress-pct {
      display: block;
      text-align: right;
      font-size: 0.8rem;
      color: #94a3b8;
      margin-top: 0.25rem;
    }

    /* Chart */
    .chart-canvas {
      max-height: 280px;
      width: 100%;
    }

    /* Recommendations */
    .rec-list { display: flex; flex-direction: column; gap: 0.75rem; }

    .rec-item {
      display: flex;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      border-radius: 0.75rem;
      border-left: 3px solid transparent;
      background: #f8fafc;
    }

    .rec-critical { border-left-color: #ef4444; background: #fef2f2; }
    .rec-warning  { border-left-color: #f59e0b; background: #fffbeb; }
    .rec-ok       { border-left-color: #22c55e; background: #f0fdf4; }

    .rec-icon { font-size: 1.25rem; flex-shrink: 0; }
    .rec-body { flex: 1; }

    .rec-criterion {
      font-weight: 600;
      font-size: 0.9rem;
      margin: 0 0 0.25rem;
      color: #1e293b;
    }

    .rec-analysis { color: #94a3b8; font-weight: 400; }
    .rec-text { font-size: 0.85rem; color: #475569; margin: 0; }

    /* Criteria table */
    .analysis-group { margin-bottom: 2rem; }

    .analysis-name {
      font-size: 1rem;
      font-weight: 600;
      color: #0284c7;
      margin: 0 0 0.75rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #e0f2fe;
    }

    .criteria-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
    }

    .criteria-table th {
      text-align: left;
      padding: 0.5rem 0.75rem;
      color: #94a3b8;
      font-weight: 500;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      border-bottom: 1px solid #f1f5f9;
    }

    .criterion-row td {
      padding: 0.75rem;
      border-bottom: 1px solid #f8fafc;
      vertical-align: middle;
    }

    .criterion-row:hover { background: #f8fafc; }

    .row-critical { background: #fff5f5; }
    .row-warning  { background: #fffdf0; }

    .criterion-name-cell { font-weight: 500; color: #1e293b; }

    .level-badge {
      display: inline-block;
      padding: 0.2rem 0.5rem;
      border-radius: 0.375rem;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .level-1 { background: #dcfce7; color: #15803d; }
    .level-2 { background: #dbeafe; color: #1d4ed8; }
    .level-3 { background: #f3e8ff; color: #7c3aed; }

    .value-cell { min-width: 140px; }

    .value-text { color: #1e293b; font-weight: 600; }
    .no-value { color: #cbd5e1; }

    .inline-edit { display: flex; gap: 0.25rem; align-items: center; }
    .edit-input { width: 100px; }

    .edit-btn {
      opacity: 0;
      transition: opacity 0.15s;
      margin-left: 0.25rem;
    }
    .criterion-row:hover .edit-btn { opacity: 1; }

    .status-badge {
      display: inline-block;
      padding: 0.2rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.78rem;
      white-space: nowrap;
    }

    .status-ok       { background: #dcfce7; color: #15803d; }
    .status-warning  { background: #fef9c3; color: #854d0e; }
    .status-critical { background: #fee2e2; color: #991b1b; }
    .status-empty    { background: #f1f5f9; color: #94a3b8; }

    .rec-tip { font-size: 0.8rem; color: #64748b; line-height: 1.4; }

    .empty {
      text-align: center;
      color: #94a3b8;
      padding: 2rem;
    }
  `],
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('healthChart') chartCanvasRef!: ElementRef<HTMLCanvasElement>;

  private api = inject(ApiService);
  private platformId = inject(PLATFORM_ID);

  loading = true;
  progress: any = null;
  recommendations: Recommendation[] = [];
  criteriaEntries: CriterionEntry[] = [];
  analysisGroups: AnalysisGroup[] = [];

  // Inline edit state
  editingId: string | null = null;
  editValue = '';

  private chartInstance: any = null;

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    // Chart is initialized after data loads.
  }

  loadData(): void {
    this.loading = true;

    this.api.getProgress().subscribe({
      next: (res: any) => (this.progress = res.data || res),
      error: () => {},
    });

    this.api.getUserCriteria().subscribe({
      next: (res: any) => {
        const entries: CriterionEntry[] = res.data || res;
        this.criteriaEntries = entries;
        this.buildAnalysisGroups(entries);
        this.loading = false;
        setTimeout(() => this.renderChart(entries), 50);
      },
      error: () => (this.loading = false),
    });

    this.api.getRecommendations().subscribe({
      next: (res: any) => (this.recommendations = res.data || res),
      error: () => {},
    });
  }

  buildAnalysisGroups(entries: CriterionEntry[]): void {
    const map = new Map<string, AnalysisGroup>();
    for (const e of entries) {
      const key = e.analysis_id || 'other';
      if (!map.has(key)) {
        map.set(key, { name: e.analysis_name || 'Прочее', entries: [] });
      }
      map.get(key)!.entries.push(e);
    }
    this.analysisGroups = Array.from(map.values());
  }

  async renderChart(entries: CriterionEntry[]): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || !this.chartCanvasRef) return;

    const { Chart, registerables } = await import('chart.js');
    Chart.register(...registerables);

    const groups = this.analysisGroups;
    const labels = groups.map(g => g.name);
    const filled = groups.map(g => g.entries.filter(e => e.value && e.value !== '').length);
    const total = groups.map(g => g.entries.length);
    const pcts = total.map((t, i) => (t > 0 ? Math.round((filled[i] / t) * 100) : 0));

    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    const ctx = this.chartCanvasRef.nativeElement.getContext('2d')!;
    this.chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Заполнено (%)',
            data: pcts,
            backgroundColor: pcts.map(p =>
              p >= 80 ? 'rgba(34, 197, 94, 0.7)' :
              p >= 50 ? 'rgba(234, 179, 8, 0.7)' :
                        'rgba(239, 68, 68, 0.7)'
            ),
            borderRadius: 8,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => `${ctx.raw}% заполнено`,
            },
          },
        },
        scales: {
          y: {
            min: 0,
            max: 100,
            ticks: { callback: v => v + '%' },
            grid: { color: 'rgba(0,0,0,0.05)' },
          },
          x: {
            grid: { display: false },
            ticks: {
              maxRotation: 30,
              font: { size: 11 },
            },
          },
        },
      },
    });
  }

  startEdit(entry: CriterionEntry): void {
    this.editingId = entry.criterion_id;
    this.editValue = entry.value || '';
  }

  cancelEdit(): void {
    this.editingId = null;
    this.editValue = '';
  }

  saveValue(entry: CriterionEntry): void {
    const value = this.editValue.trim();
    this.api.setUserCriterion(entry.criterion_id, value).subscribe({
      next: () => {
        entry.value = value;
        this.cancelEdit();
        this.loadData();
      },
      error: () => this.cancelEdit(),
    });
  }

  statusEmoji(status: string): string {
    const map: Record<string, string> = {
      ok: '✅', warning: '⚠️', critical: '🔴', empty: '⚪',
    };
    return map[status] || '⚪';
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      ok: 'Норма', warning: 'Внимание', critical: 'Критично', empty: 'Нет данных',
    };
    return map[status] || status;
  }

  severityEmoji(severity: string): string {
    const map: Record<string, string> = {
      critical: '🔴', warning: '⚠️', ok: '✅',
    };
    return map[severity] || '💡';
  }

  levelLabel(level: number): string {
    return level === 1 ? '⭐ Базовый' : level === 2 ? '⭐⭐ Продвинутый' : '⭐⭐⭐ Долголетие';
  }
}
