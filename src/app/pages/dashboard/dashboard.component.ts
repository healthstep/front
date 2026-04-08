import { Component, OnInit, AfterViewInit, inject, ElementRef, ViewChild, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TuiButton, TuiLoader } from '@taiga-ui/core';
import { NavComponent } from '../../shared/nav/nav.component';
import { ApiService } from '../../core/services/api.service';

interface CriterionEntry {
  criterion_id: string;
  criterion_name: string;
  group_id: string;
  value: string;
  status: string;
  recommendation: string;
  level: number;
  severity: string;
  input_type: string;
}

interface CriterionGroup {
  id: string;
  name: string;
  sort_order: number;
}

interface GroupWithEntries {
  group: CriterionGroup;
  entries: CriterionEntry[];
}

interface WeeklyItem {
  recommendation_id: string;
  criterion_id: string;
  criterion_name: string;
  type: string;
  title: string;
  weight: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, TuiButton, TuiLoader, NavComponent, FormsModule],
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

      <!-- Tabs -->
      <div class="tabs">
        <button class="tab" [class.active]="activeTab === 'criteria'" (click)="activeTab = 'criteria'">🔬 Показатели</button>
        <button class="tab" [class.active]="activeTab === 'recommendations'" (click)="activeTab = 'recommendations'">💡 Рекомендации</button>
        <button class="tab" [class.active]="activeTab === 'weekly'" (click)="activeTab = 'weekly'">📅 Неделя</button>
        <button class="tab" [class.active]="activeTab === 'chart'" (click)="activeTab = 'chart'">📈 График</button>
      </div>

      <!-- Criteria Tab -->
      <section class="card criteria-card" *ngIf="activeTab === 'criteria'">
        @if (loading) {
          <tui-loader />
        }

        @if (!loading && criteriaGroups.length === 0) {
          <p class="empty">Нет данных. Добавьте первые показатели через бота.</p>
        }

        @for (gw of criteriaGroups; track gw.group.id) {
          <div class="criterion-group">
            <h3 class="group-name">{{ gw.group.name }}
              <span class="group-count">({{ filledCount(gw) }}/{{ gw.entries.length }})</span>
            </h3>
            <table class="criteria-table">
              <thead>
                <tr>
                  <th>Показатель</th>
                  <th>Значение</th>
                  <th>Статус</th>
                  <th>Рекомендация</th>
                </tr>
              </thead>
              <tbody>
                @for (entry of gw.entries; track entry.criterion_id) {
                  <tr class="criterion-row" [class]="'row-' + entry.status">
                    <td class="criterion-name-cell">
                      <span class="level-dot" [class]="'lvl-' + entry.level"></span>
                      {{ entry.criterion_name }}
                    </td>
                    <td class="value-cell">
                      @if (editingId === entry.criterion_id) {
                        <div class="inline-edit">
                          <input
                            [(ngModel)]="editValue"
                            type="text"
                            class="edit-input"
                            (keyup.enter)="saveValue(entry)"
                            placeholder="Введите значение"
                          />
                          <button tuiButton size="xs" appearance="primary" (click)="saveValue(entry)">✓</button>
                          <button tuiButton size="xs" appearance="ghost" (click)="cancelEdit()">✗</button>
                        </div>
                      } @else {
                        <span class="value-text" *ngIf="entry.value">
                          {{ formatValue(entry) }}
                        </span>
                        <span class="no-value" *ngIf="!entry.value">—</span>
                        <button tuiButton size="xs" appearance="ghost" (click)="startEdit(entry)" class="edit-btn">✏️</button>
                      }
                    </td>
                    <td class="status-cell">
                      <span class="status-badge" [class]="'status-' + entry.status">
                        {{ statusEmoji(entry.status) }} {{ statusLabel(entry.status) }}
                      </span>
                    </td>
                    <td class="rec-cell">
                      <span class="rec-tip" *ngIf="entry.recommendation && entry.status !== 'ok'">{{ entry.recommendation }}</span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

        <!-- Ungrouped criteria -->
        @if (ungroupedEntries.length > 0) {
          <div class="criterion-group">
            <h3 class="group-name">Прочее <span class="group-count">({{ filledCountRaw(ungroupedEntries) }}/{{ ungroupedEntries.length }})</span></h3>
            <table class="criteria-table">
              <thead><tr><th>Показатель</th><th>Значение</th><th>Статус</th><th>Рекомендация</th></tr></thead>
              <tbody>
                @for (entry of ungroupedEntries; track entry.criterion_id) {
                  <tr class="criterion-row" [class]="'row-' + entry.status">
                    <td class="criterion-name-cell">{{ entry.criterion_name }}</td>
                    <td class="value-cell">
                      @if (editingId === entry.criterion_id) {
                        <div class="inline-edit">
                          <input [(ngModel)]="editValue" type="text" class="edit-input" (keyup.enter)="saveValue(entry)" />
                          <button tuiButton size="xs" appearance="primary" (click)="saveValue(entry)">✓</button>
                          <button tuiButton size="xs" appearance="ghost" (click)="cancelEdit()">✗</button>
                        </div>
                      } @else {
                        <span class="value-text" *ngIf="entry.value">{{ entry.value }}</span>
                        <span class="no-value" *ngIf="!entry.value">—</span>
                        <button tuiButton size="xs" appearance="ghost" (click)="startEdit(entry)" class="edit-btn">✏️</button>
                      }
                    </td>
                    <td><span class="status-badge" [class]="'status-' + entry.status">{{ statusEmoji(entry.status) }} {{ statusLabel(entry.status) }}</span></td>
                    <td><span class="rec-tip" *ngIf="entry.recommendation && entry.status !== 'ok'">{{ entry.recommendation }}</span></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </section>

      <!-- Recommendations Tab -->
      <section class="card" *ngIf="activeTab === 'recommendations'">
        <h2 class="section-title">💡 Рекомендации</h2>
        <div *ngIf="recommendations.length === 0" class="empty">🎉 Все показатели в норме!</div>
        <div class="rec-list">
          <div *ngFor="let r of recommendations" class="rec-item" [class]="'rec-' + r.severity">
            <span class="rec-icon">{{ severityEmoji(r.severity) }}</span>
            <div class="rec-body">
              <p class="rec-criterion">{{ r.criterion_name }}</p>
              <p class="rec-text">{{ r.text }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Weekly Recommendations Tab -->
      <section class="card" *ngIf="activeTab === 'weekly'">
        <div class="section-header">
          <h2 class="section-title">📅 Рекомендации на неделю
            <span class="week-label" *ngIf="weekStart"> — с {{ weekStart }}</span>
          </h2>
          <div *ngIf="loadingWeekly" class="inline-loader"><tui-loader size="xs" /></div>
        </div>
        <div *ngIf="!loadingWeekly && weeklyItems.length === 0" class="empty">🎉 На эту неделю рекомендаций нет — все показатели в норме!</div>
        <div class="weekly-list">
          <div *ngFor="let item of weeklyItems" class="weekly-item" [class.spent]="item.weight === 0">
            <span class="weekly-icon">{{ recTypeEmoji(item.type) }}</span>
            <div class="weekly-body">
              <p class="weekly-title" [class.line-through]="item.weight === 0">{{ item.title }}</p>
              <p class="weekly-criterion" *ngIf="item.criterion_name">{{ item.criterion_name }}</p>
            </div>
            <div class="weekly-status" *ngIf="item.weight === 0">
              <span class="spent-badge">✓ Отправлено</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Chart Tab -->
      <section class="card chart-card" *ngIf="activeTab === 'chart'">
        <h2 class="section-title">📈 Визуализация здоровья по группам</h2>
        <canvas #healthChart class="chart-canvas"></canvas>
      </section>
    </div>
  `,
  styles: [`
    .page {
      max-width: 960px;
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
    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }

    .level-label { color: #64748b; font-size: 0.9rem; margin: 0.25rem 0 0; }

    .progress-stats { display: flex; align-items: center; gap: 0.5rem; }
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

    /* Tabs */
    .tabs {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .tab {
      padding: 0.5rem 1rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      background: white;
      color: #64748b;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.15s;
    }

    .tab:hover { background: #f1f5f9; }

    .tab.active {
      background: #0284c7;
      color: white;
      border-color: #0284c7;
      font-weight: 600;
    }

    /* Criteria groups */
    .criterion-group { margin-bottom: 2rem; }

    .group-name {
      font-size: 1rem;
      font-weight: 600;
      color: #0284c7;
      margin: 0 0 0.75rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #e0f2fe;
    }

    .group-count { color: #94a3b8; font-weight: 400; font-size: 0.85rem; margin-left: 0.25rem; }

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

    .criterion-name-cell { font-weight: 500; color: #1e293b; display: flex; align-items: center; gap: 0.5rem; }

    .level-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .lvl-1 { background: #22c55e; }
    .lvl-2 { background: #3b82f6; }
    .lvl-3 { background: #a855f7; }

    .value-cell { min-width: 140px; }
    .value-text { color: #1e293b; font-weight: 600; }
    .no-value { color: #cbd5e1; }

    .inline-edit { display: flex; gap: 0.25rem; align-items: center; }
    .edit-input {
      width: 100px;
      padding: 0.25rem 0.5rem;
      border: 1px solid #0284c7;
      border-radius: 0.375rem;
      font-size: 0.875rem;
    }

    .edit-btn { opacity: 0; transition: opacity 0.15s; margin-left: 0.25rem; }
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
    .rec-criterion { font-weight: 600; font-size: 0.9rem; margin: 0 0 0.25rem; color: #1e293b; }
    .rec-text { font-size: 0.85rem; color: #475569; margin: 0; }

    /* Weekly */
    .week-label { font-size: 0.85rem; font-weight: 400; color: #94a3b8; }

    .weekly-list { display: flex; flex-direction: column; gap: 0.75rem; }

    .weekly-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      border-radius: 0.75rem;
      background: #f8fafc;
      border-left: 3px solid #0284c7;
    }

    .weekly-item.spent {
      border-left-color: #cbd5e1;
      opacity: 0.6;
    }

    .weekly-icon { font-size: 1.25rem; flex-shrink: 0; }
    .weekly-body { flex: 1; }

    .weekly-title {
      font-weight: 600;
      font-size: 0.9rem;
      margin: 0 0 0.2rem;
      color: #1e293b;
    }

    .line-through { text-decoration: line-through; color: #94a3b8; }

    .weekly-criterion {
      font-size: 0.8rem;
      color: #64748b;
      margin: 0;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .section-header .section-title { margin-bottom: 0; }

    .inline-loader { display: inline-flex; }

    .weekly-status { margin-left: auto; }

    .spent-badge {
      font-size: 0.75rem;
      color: #22c55e;
      font-weight: 600;
    }

    /* Chart */
    .chart-canvas { max-height: 300px; width: 100%; }

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
  loadingWeekly = false;
  activeTab = 'criteria';

  progress: any = null;
  recommendations: any[] = [];
  weeklyItems: WeeklyItem[] = [];
  weekStart = '';

  criteriaEntries: CriterionEntry[] = [];
  groups: CriterionGroup[] = [];
  criteriaGroups: GroupWithEntries[] = [];
  ungroupedEntries: CriterionEntry[] = [];

  editingId: string | null = null;
  editValue = '';

  private chartInstance: any = null;

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {}

  loadData(): void {
    this.loading = true;

    this.api.getProgress().subscribe({
      next: (res: any) => (this.progress = res.data || res),
      error: () => {},
    });

    this.api.getRecommendations().subscribe({
      next: (res: any) => (this.recommendations = res.data || res || []),
      error: () => {},
    });

    this.api.getWeeklyRecommendations().subscribe({
      next: (res: any) => {
        const d = res.data || res;
        this.weeklyItems = d.items || [];
        this.weekStart = d.week_start || '';
      },
      error: () => {},
    });

    this.api.listGroups().subscribe({
      next: (res: any) => {
        this.groups = res.data || res || [];
        this.loadCriteria();
      },
      error: () => this.loadCriteria(),
    });
  }

  loadCriteria(): void {
    this.api.getUserCriteria().subscribe({
      next: (res: any) => {
        const entries: CriterionEntry[] = res.data || res || [];
        this.criteriaEntries = entries;
        this.buildGroups(entries);
        this.loading = false;
        if (this.activeTab === 'chart') {
          setTimeout(() => this.renderChart(), 50);
        }
      },
      error: () => (this.loading = false),
    });
  }

  buildGroups(entries: CriterionEntry[]): void {
    const groupMap = new Map<string, GroupWithEntries>();
    for (const g of this.groups) {
      groupMap.set(g.id, { group: g, entries: [] });
    }

    this.ungroupedEntries = [];
    for (const e of entries) {
      if (e.group_id && groupMap.has(e.group_id)) {
        groupMap.get(e.group_id)!.entries.push(e);
      } else {
        this.ungroupedEntries.push(e);
      }
    }

    this.criteriaGroups = Array.from(groupMap.values()).filter(g => g.entries.length > 0);
  }

  async renderChart(): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || !this.chartCanvasRef) return;

    const { Chart, registerables } = await import('chart.js');
    Chart.register(...registerables);

    const labels = this.criteriaGroups.map(g => g.group.name);
    const pcts = this.criteriaGroups.map(g => {
      const total = g.entries.length;
      const filled = g.entries.filter(e => e.value && e.value !== '').length;
      return total > 0 ? Math.round((filled / total) * 100) : 0;
    });

    if (this.chartInstance) this.chartInstance.destroy();

    const ctx = this.chartCanvasRef.nativeElement.getContext('2d')!;
    this.chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Заполнено (%)',
          data: pcts,
          backgroundColor: pcts.map(p =>
            p >= 80 ? 'rgba(34,197,94,0.7)' : p >= 50 ? 'rgba(234,179,8,0.7)' : 'rgba(239,68,68,0.7)'
          ),
          borderRadius: 8,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx: any) => `${ctx.raw}% заполнено` } },
        },
        scales: {
          y: { min: 0, max: 100, ticks: { callback: (v: any) => v + '%' }, grid: { color: 'rgba(0,0,0,0.05)' } },
          x: { grid: { display: false }, ticks: { maxRotation: 30, font: { size: 11 } } },
        },
      },
    });
  }

  onTabChange(tab: string): void {
    this.activeTab = tab;
    if (tab === 'chart') {
      setTimeout(() => this.renderChart(), 50);
    }
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

  filledCount(gw: GroupWithEntries): number {
    return gw.entries.filter(e => e.value && e.value !== '').length;
  }

  filledCountRaw(entries: CriterionEntry[]): number {
    return entries.filter(e => e.value && e.value !== '').length;
  }

  formatValue(entry: CriterionEntry): string {
    if (!entry.value) return '';
    if (entry.input_type === 'check' || entry.input_type === 'boolean') {
      return entry.value === '1' ? '✅' : '❌';
    }
    return entry.value;
  }

  statusEmoji(status: string): string {
    const map: Record<string, string> = { ok: '✅', warning: '⚠️', critical: '🔴', empty: '⚪' };
    return map[status] || '⚪';
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = { ok: 'Норма', warning: 'Внимание', critical: 'Критично', empty: 'Нет данных' };
    return map[status] || status;
  }

  severityEmoji(severity: string): string {
    const map: Record<string, string> = { critical: '🔴', warning: '⚠️', ok: '✅' };
    return map[severity] || '💡';
  }

  recTypeEmoji(type: string): string {
    const map: Record<string, string> = { reminder: '🔔', recommendation: '💡', alarm: '🚨', expiration_reminder: '⏰' };
    return map[type] || '💡';
  }
}
