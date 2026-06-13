import { Component, OnInit, OnDestroy, AfterViewInit, inject, ElementRef, ViewChild, PLATFORM_ID, DestroyRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TuiButton, TuiLoader, TuiIcon, TuiTextfield, TuiInput, TuiLabel } from '@taiga-ui/core';
import { TuiDay } from '@taiga-ui/cdk/date-time';
import { TuiInputDate } from '@taiga-ui/kit/components/input-date';
import { TuiFiles, tuiFilesAccepted, type TuiFileLike } from '@taiga-ui/kit/components/files';
import { filter, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { NavComponent } from '../../shared/nav/nav.component';
import { ApiService } from '../../core/services/api.service';

interface CriterionEntry {
  criterion_id: string;
  criterion_name: string;
  group_id: string;
  value: string;
  status: string;
  recommendation?: string;
  description?: string;
  level: number;
  severity: string;
  input_type: string;
  instruction?: string;
  analysis_id?: number;
  analysis_name?: string;
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
  text?: string;
  weight: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    TuiButton,
    TuiLoader,
    TuiTextfield,
    TuiInput,
    TuiLabel,
    ...TuiInputDate,
    ...TuiFiles,
    NavComponent,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('healthChart') chartCanvasRef!: ElementRef<HTMLCanvasElement>;

  private api = inject(ApiService);
  private platformId = inject(PLATFORM_ID);
  private destroyRef = inject(DestroyRef);
  private sanitizer = inject(DomSanitizer);

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
  /** Дата анализа для Taiga `tuiInputDate` (не нативный `type="date"`). */
  editMeasuredAtDay: TuiDay | null = null;
  confirmEdit: string | null = null;

  /** Пол пользователя (для разбора PDF). */
  userSex = '';

  /** Зона загрузки PDF (Taiga InputFiles). */
  readonly labFileControl = new FormControl<readonly TuiFileLike[] | null>(null);
  isBrowser = false;
  labImporting = false;
  labError: string | null = null;
  labPendingId: string | null = null;
  labRows: { name: string; value: string; id: string }[] = [];
  labNote = '';
  labSaveSuccess = false;

  /**
   * Верхняя граница даты анализа (текущий день). Стабильная ссылка — не геттер:
   * иначе [max] на tuiInputDate даёт новый TuiDay на каждом change detection и вешает UI.
   */
  maxAnalysisDay: TuiDay = TuiDay.currentLocal();

  /** Сообщение об ошибке при сохранении показателя (см. saveValue). */
  criterionSaveError: string | null = null;

  /** Раскрытая инструкция по анализу для строки показателя (id критерия). */
  instructionOpenForId: string | null = null;

  /** Раскрытое описание показателя (id критерия). */
  descOpenForId: string | null = null;

  private instructionCache = new Map<string, SafeHtml>();
  private chartInstance: any = null;
  private chartFrame = 0;

  ngOnInit(): void {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      this.maxAnalysisDay = TuiDay.currentLocal();
    }
    this.labFileControl.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter(() => !this.labImporting),
        filter(() => tuiFilesAccepted(this.labFileControl).length > 0),
      )
      .subscribe(() => {
        const files = tuiFilesAccepted(this.labFileControl).slice(0, 5);
        this.runLabImportFromFiles(files);
      });
    this.loadData();
  }

  ngOnDestroy(): void {
    if (this.chartFrame) {
      cancelAnimationFrame(this.chartFrame);
      this.chartFrame = 0;
    }
    this.chartInstance?.destroy?.();
    this.chartInstance = null;
  }

  ngAfterViewInit(): void {}

  get labFilesList(): File[] {
    return tuiFilesAccepted(this.labFileControl);
  }

  loadData(): void {
    this.loading = true;
    this.loadingProgress = true;

    forkJoin({
      progress: this.api.getProgress().pipe(catchError(() => of(null))),
      groups: this.api.listGroups().pipe(catchError(() => of(null))),
      weekly: this.api.getWeeklyRecommendations().pipe(catchError(() => of(null))),
      me: this.api.getMe().pipe(catchError(() => of(null))),
    }).subscribe({
      next: bundle => {
        this.loadingProgress = false;
        const m = bundle.me as any;
        if (m) {
          const d = m.data ?? m;
          this.userSex = d.sex || '';
        }
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
        if (this.activeTab === 'criteria') {
          this.scheduleChartRender();
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

  /** Откладывает отрисовку графика в animation frame, чтобы не блокировать клик/ввод. */
  scheduleChartRender(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.chartFrame) {
      cancelAnimationFrame(this.chartFrame);
    }
    this.chartFrame = requestAnimationFrame(() => {
      this.chartFrame = 0;
      void this.renderChart();
    });
  }

  async renderChart(): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || !this.chartCanvasRef?.nativeElement) return;

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
    if (tab === 'criteria') {
      this.scheduleChartRender();
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
    this.criterionSaveError = null;
    this.confirmEdit = null;
    this.editingId = entry.criterion_id;
    this.editValue = entry.value || '';
    this.editMeasuredAtDay = TuiDay.currentLocal();
  }

  cancelConfirm(): void {
    this.confirmEdit = null;
  }

  cancelEdit(): void {
    this.criterionSaveError = null;
    this.editingId = null;
    this.editValue = '';
    this.editMeasuredAtDay = null;
    this.confirmEdit = null;
  }

  /**
   * Кнопка «Сохранить»: нельзя использовать `!editValue` — для чисел значение 0 валидно, но `!0 === true`.
   */
  canSaveEdit(entry: CriterionEntry): boolean {
    if (entry.input_type === 'check' || entry.input_type === 'boolean') {
      return this.editValue === '0' || this.editValue === '1';
    }
    const v = this.editValue as string | number | null | undefined;
    if (v === null || v === undefined) return false;
    if (typeof v === 'number') return !Number.isNaN(v);
    return String(v).trim() !== '';
  }

  /** Лёгкое обновление списка и прогресса без полного loadData (меньше работы = меньше фризов). */
  private refreshAfterCriterionSave(): void {
    forkJoin({
      progress: this.api.getProgress().pipe(catchError(() => of(null))),
      entries: this.api.getUserCriteria().pipe(catchError(() => of(null))),
    }).subscribe({
      next: ({ progress, entries }) => {
        if (progress) {
          const p = progress as { data?: unknown };
          this.progress = (p as any).data ?? p;
        }
        const e = entries as { data?: CriterionEntry[] } | CriterionEntry[] | null;
        const list: CriterionEntry[] = Array.isArray(e) ? e : (e as any)?.data || [];
        this.criteriaEntries = list;
        this.buildGroups(this.criteriaEntries);
        this.scheduleChartRender();
      },
    });
  }

  saveValue(entry: CriterionEntry): void {
    this.criterionSaveError = null;
    if (!this.canSaveEdit(entry)) return;

    const value =
      entry.input_type === 'check' || entry.input_type === 'boolean'
        ? String(this.editValue)
        : String(this.editValue ?? '').trim();

    this.savingCriterionId = entry.criterion_id;
    const measuredAt = this.editMeasuredAtDay?.toJSON();
    this.api.setUserCriterion(entry.criterion_id, value, measuredAt || undefined).subscribe({
      next: () => {
        this.savingCriterionId = null;
        entry.value = value;
        this.cancelEdit();
        this.refreshAfterCriterionSave();
      },
      error: (e: { error?: { message?: string } }) => {
        this.savingCriterionId = null;
        this.criterionSaveError = e?.error?.message || 'Не удалось сохранить. Попробуйте ещё раз.';
      },
    });
  }

  toggleInstruction(entry: CriterionEntry): void {
    const t = (entry.instruction || '').trim();
    if (!t) return;
    this.instructionOpenForId =
      this.instructionOpenForId === entry.criterion_id ? null : entry.criterion_id;
  }

  toggleDesc(entry: CriterionEntry): void {
    const t = (entry.description || '').trim();
    if (!t) return;
    this.descOpenForId =
      this.descOpenForId === entry.criterion_id ? null : entry.criterion_id;
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

  safeInstruction(text: string): SafeHtml {
    if (this.instructionCache.has(text)) {
      return this.instructionCache.get(text)!;
    }
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const linked = escaped.replace(
      /(https?:\/\/[^\s<]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>',
    );
    const result = this.sanitizer.bypassSecurityTrustHtml(linked.replace(/\n/g, '<br>'));
    this.instructionCache.set(text, result);
    return result;
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      ok: 'Норма',
      critical: 'Вне нормы',
      empty: 'Нет данных',
    };
    return map[status] || status;
  }

  statusIcon(status: string): string {
    const map: Record<string, string> = {
      ok: '@tui.check-circle',
      critical: '@tui.alert-triangle',
      empty: '@tui.circle',
    };
    return map[status] || '@tui.circle';
  }

  recTypeLabel(type: string): string {
    const map: Record<string, string> = {
      reminder: 'Нет данных',
      recommendation: 'Рекомендация',
      expiration_reminder: 'Срок истекает',
    };
    return map[type] || type;
  }

  recTypeIcon(type: string): string {
    const map: Record<string, string> = {
      reminder: '@tui.bell',
      recommendation: '@tui.info',
      expiration_reminder: '@tui.clock',
    };
    return map[type] || '@tui.info';
  }

  recTypeEmoji(type: string): string {
    const map: Record<string, string> = {
      reminder: '🔔',
      recommendation: '💡',
      expiration_reminder: '⏰',
    };
    return map[type] || '💡';
  }

  removeLabFile(f: File): void {
    const isSame = (a: File, b: File) =>
      a === b || (a.name === b.name && a.size === b.size && a.lastModified === b.lastModified);
    const rest = tuiFilesAccepted(this.labFileControl).filter(x => !isSame(x, f));
    this.labFileControl.setValue(rest.length > 0 ? rest : null, { emitEvent: false });
  }

  onLabReject(_files: File[]): void {
    this.labError = 'Разрешены только PDF-файлы';
  }

  private runLabImportFromFiles(files: File[]): void {
    this.labImporting = true;
    this.labError = null;
    this.labPendingId = null;
    this.labRows = [];
    this.labNote = '';
    this.api.importLabPdfs(files, this.userSex || undefined).subscribe({
      next: (res: any) => {
        this.labImporting = false;
        this.labFileControl.setValue(null, { emitEvent: false });
        const d = res.data || res;
        this.labPendingId = d.pending_import_id || null;
        this.labNote = d.model_note || '';
        const uc = d.user_criteria || [];
        this.labRows = uc.map((x: any) => ({
          id: x.criterion_id,
          name: x.criterion_name,
          value: x.value,
        }));
      },
      error: (e: any) => {
        this.labImporting = false;
        this.labFileControl.setValue(null, { emitEvent: false });
        this.labError = e?.error?.message || 'Не удалось обработать файлы';
      },
    });
  }

  confirmLab(accept: boolean): void {
    if (!this.labPendingId) return;
    this.labImporting = true;
    this.labError = null;
    this.api.confirmLabImport(this.labPendingId, accept, this.userSex || undefined).subscribe({
      next: () => {
        this.labImporting = false;
        this.labSaveSuccess = accept;
        if (this.labSaveSuccess) {
          setTimeout(() => (this.labSaveSuccess = false), 3000);
        }
        this.labPendingId = null;
        this.labRows = [];
        this.labNote = '';
        this.loadData();
      },
      error: (e: any) => {
        this.labImporting = false;
        this.labError = e?.error?.message || 'Ошибка подтверждения';
      },
    });
  }
}
