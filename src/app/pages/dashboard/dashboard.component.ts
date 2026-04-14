import { Component, OnInit, AfterViewInit, inject, ElementRef, ViewChild, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TuiButton, TuiLoader, TuiIcon } from '@taiga-ui/core';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
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
  imports: [CommonModule, TuiButton, TuiLoader, TuiIcon, NavComponent, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('healthChart') chartCanvasRef!: ElementRef<HTMLCanvasElement>;

  private api = inject(ApiService);
  private platformId = inject(PLATFORM_ID);

  loading = true;
  loadingProgress = true;
  loadingWeekly = false;
  loadingChart = false;
  activeTab = 'criteria';

  progress: any = null;
  savingCriterionId: string | null = null;
  weeklyItems: WeeklyItem[] = [];
  weekStart = '';

  criteriaEntries: CriterionEntry[] = [];
  groups: CriterionGroup[] = [];
  criteriaGroups: GroupWithEntries[] = [];
  ungroupedEntries: CriterionEntry[] = [];

  editingId: string | null = null;
  editValue = '';
  editMeasuredAt = '';
  confirmEdit: string | null = null;
  today = new Date().toISOString().split('T')[0];

  private chartInstance: any = null;

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {}

  loadData(): void {
    this.loading = true;
    this.loadingProgress = true;

    forkJoin({
      progress: this.api.getProgress().pipe(catchError(() => of(null))),
      groups: this.api.listGroups().pipe(catchError(() => of(null))),
      weekly: this.api.getWeeklyRecommendations().pipe(catchError(() => of(null))),
    }).subscribe({
      next: bundle => {
        this.loadingProgress = false;
        const pr = bundle.progress as any;
        if (pr) {
          this.progress = pr.data ?? pr;
        }
        const gr = bundle.groups as any;
        this.groups = gr ? (gr.data ?? gr) ?? [] : [];
        const wk = bundle.weekly as any;
        if (wk) {
          const d = wk.data ?? wk;
          this.weeklyItems = d.items || [];
          this.weekStart = d.week_start || '';
        }
        this.loadCriteria();
      },
      error: () => {
        this.loadingProgress = false;
        this.loading = false;
      },
    });
  }

  refreshWeekly(): void {
    this.loadingWeekly = true;
    this.api.getWeeklyRecommendations().subscribe({
      next: (res: any) => {
        const d = res.data || res;
        this.weeklyItems = d.items || [];
        this.weekStart = d.week_start || '';
        this.loadingWeekly = false;
      },
      error: () => (this.loadingWeekly = false),
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

    this.loadingChart = true;
    try {
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
    } finally {
      this.loadingChart = false;
    }
  }

  onTabChange(tab: string): void {
    const prev = this.activeTab;
    this.activeTab = tab;
    if (tab === 'chart') {
      setTimeout(() => this.renderChart(), 50);
    }
    if (tab === 'weekly' && tab !== prev) {
      this.refreshWeekly();
    }
  }

  startEdit(entry: CriterionEntry): void {
    if (entry.value && entry.value !== '') {
      this.confirmEdit = entry.criterion_id;
    } else {
      this.openEdit(entry);
    }
  }

  openEdit(entry: CriterionEntry): void {
    this.confirmEdit = null;
    this.editingId = entry.criterion_id;
    this.editValue = entry.value || '';
    // Keep existing date if set, otherwise default to today
    this.editMeasuredAt = this.today;
  }

  cancelConfirm(): void {
    this.confirmEdit = null;
  }

  cancelEdit(): void {
    this.editingId = null;
    this.editValue = '';
    this.editMeasuredAt = '';
    this.confirmEdit = null;
  }

  saveValue(entry: CriterionEntry): void {
    const value = String(this.editValue ?? '').trim();
    if (!value) return;
    this.savingCriterionId = entry.criterion_id;
    this.api.setUserCriterion(entry.criterion_id, value, this.editMeasuredAt || undefined).subscribe({
      next: () => {
        this.savingCriterionId = null;
        entry.value = value;
        this.cancelEdit();
        this.loadData();
      },
      error: () => {
        this.savingCriterionId = null;
        this.cancelEdit();
      },
    });
  }

  goToAndEdit(criterionId: string): void {
    this.activeTab = 'criteria';
    this.cancelEdit();
    setTimeout(() => {
      const el = document.getElementById(`crit-${criterionId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('row-highlight');
        setTimeout(() => el.classList.remove('row-highlight'), 2500);
      }
      const entry = this.criteriaEntries.find(e => e.criterion_id === criterionId);
      if (entry) this.startEdit(entry);
    }, 150);
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
      return entry.value === '1' ? 'Да' : 'Нет';
    }
    return entry.value;
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      ok: 'Норма',
      warning: 'Внимание',
      critical: 'Критично',
      empty: 'Нет данных',
    };
    return map[status] || status;
  }

  statusIcon(status: string): string {
    const map: Record<string, string> = {
      ok: '@tui.check-circle',
      warning: '@tui.alert-circle',
      critical: '@tui.alert-triangle',
      empty: '@tui.circle',
    };
    return map[status] || '@tui.circle';
  }

  recTypeLabel(type: string): string {
    const map: Record<string, string> = {
      reminder: 'Нет данных',
      recommendation: 'Совет',
      alarm: 'Тревога',
      expiration_reminder: 'Срок истекает',
    };
    return map[type] || type;
  }

  recTypeIcon(type: string): string {
    const map: Record<string, string> = {
      reminder: '@tui.bell',
      recommendation: '@tui.info',
      alarm: '@tui.alert-triangle',
      expiration_reminder: '@tui.clock',
    };
    return map[type] || '@tui.info';
  }

  recTypeEmoji(type: string): string {
    const map: Record<string, string> = {
      reminder: '🔔',
      recommendation: '💡',
      alarm: '⚠️',
      expiration_reminder: '⏰',
    };
    return map[type] || '💡';
  }
}
