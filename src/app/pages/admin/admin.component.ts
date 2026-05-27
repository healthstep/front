import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TuiButton, TuiLoader, TuiIcon, TuiTextfield, TuiInput, TuiLabel } from '@taiga-ui/core';
import { TuiTextarea } from '@taiga-ui/kit/components/textarea';
import { TuiSelect } from '@taiga-ui/kit/components/select';
import { NavComponent } from '../../shared/nav/nav.component';
import { ApiService } from '../../core/services/api.service';

interface AdminRec {
  id: string;
  criterion_id: string;
  type: string;
  title: string;
  texts: string[];
  base_weight: number;
}

interface Criterion {
  id: string;
  group_id: string;
  analysis_id?: number | '' | null;
  name: string;
  level: number;
  sex: string;
  input_type: string;
  lifetime: number;
  sort_order: number;
  min_value?: number | null;
  max_value?: number | null;
  delta?: number | null;
}

interface AnalysisRow {
  id: number;
  name: string;
  instruction: string;
}

interface Group {
  id: string;
  name: string;
  sort_order: number;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TuiButton,
    TuiLoader,
    TuiIcon,
    TuiTextfield,
    TuiInput,
    TuiLabel,
    ...TuiSelect,
    ...TuiTextarea,
    NavComponent,
  ],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
})
export class AdminComponent implements OnInit {
  private api = inject(ApiService);

  tab = 'recommendations';

  // Data
  recommendations: AdminRec[] = [];
  criteria: Criterion[] = [];
  analyses: AnalysisRow[] = [];
  groups: Group[] = [];

  // Loading states
  loadingGroups = false;
  loadingRecs = false;
  loadingCriteria = false;
  loadingAnalyses = false;
  savingRec = false;
  savingCrit = false;
  savingAnalysis = false;
  deletingRecId: string | null = null;
  deletingAnalysisId: number | null = null;

  // Recommendation form
  editingRec: AdminRec | null = null;
  recForm: Partial<AdminRec> = this.emptyRec();
  recTextsRaw = '';
  recError = '';

  // Criterion form
  editingCrit: Criterion | null = null;
  critForm: Partial<Criterion> = this.emptyCrit();
  critMinStr = '';
  critMaxStr = '';
  critDeltaStr = '';
  critError = '';

  // Analyses tab
  editingAnalysis: AnalysisRow | null = null;
  analysisForm: Partial<AnalysisRow> = this.emptyAnalysis();
  analysisError = '';

  ngOnInit(): void {
    this.loadGroups();
    this.loadCriteria();
    this.loadAnalyses();
    this.loadRecs();
  }

  switchTab(tab: string): void {
    this.tab = tab;
    this.cancelRec();
    this.cancelCrit();
    this.cancelAnalysis();
  }

  // ---- Helpers ----

  emptyRec(): Partial<AdminRec> {
    return { type: 'recommendation', base_weight: 1, texts: [], criterion_id: '' };
  }

  emptyCrit(): Partial<Criterion> {
    return { level: 1, input_type: 'numeric', lifetime: 0, sort_order: 0, sex: '', group_id: '', analysis_id: null };
  }

  criterionName(id: string): string {
    return this.criteria.find(c => c.id === id)?.name ?? id.slice(0, 8) + '…';
  }

  groupName(id: string): string {
    return this.groups.find(g => g.id === id)?.name ?? '';
  }

  analysisNameById(id: number | null | undefined): string {
    if (id == null) return '';
    return this.analyses.find(a => a.id === id)?.name ?? '';
  }

  analysisBadgeForCriterion(c: Criterion): string {
    const v = c.analysis_id;
    if (v === '' || v == null || v === undefined) return '';
    const n = typeof v === 'number' ? v : Number(v);
    if (!Number.isFinite(n) || n <= 0) return '';
    const name = this.analysisNameById(n);
    return name || `id ${n}`;
  }

  typeLabel(type: string): string {
    const map: Record<string, string> = {
      reminder: 'Нет данных',
      recommendation: 'Рекомендация',
      expiration_reminder: 'Срок',
    };
    return map[type] ?? type;
  }

  /** Значения для `select[tuiSelect]` (модель — id, подпись через `stringify`). */
  readonly recTypeIds = ['reminder', 'recommendation', 'expiration_reminder'] as const;
  readonly inputTypeIds = ['numeric', 'check', 'boolean'] as const;
  readonly sexIds = ['', 'male', 'female'] as const;

  get criterionSelectIds(): string[] {
    return this.criteria.map(c => c.id);
  }

  get groupSelectIds(): string[] {
    return ['', ...this.groups.map(g => g.id)];
  }

  /** Values for analysis select on criterion form: '' = none, then numeric ids. */
  get analysisSelectIds(): (number | '')[] {
    return ['', ...this.analyses.map(a => a.id)];
  }

  readonly stringifyRecType = (type: string): string => this.typeLabel(type);

  readonly stringifyCriterionId = (id: string | undefined): string =>
    id ? this.criterionName(id) : '';

  readonly stringifyGroupId = (id: string | undefined): string =>
    id == null || id === '' ? 'Без группы' : this.groupName(id);

  readonly stringifyAnalysisId = (id: number | '' | undefined | null): string => {
    if (id === '' || id == null) return 'Без анализа';
    const a = this.analyses.find(x => x.id === id);
    return a ? `${a.name} (id ${a.id})` : String(id);
  };

  readonly stringifyInputType = (t: string): string => {
    const map: Record<string, string> = {
      numeric: 'Число (numeric)',
      check: 'Факт — есть / нет (check)',
      boolean: 'Результат + / − (boolean)',
    };
    return map[t] ?? t;
  };

  readonly stringifySex = (s: string | undefined): string => {
    if (s == null || s === '') return 'Все';
    if (s === 'male') return 'Мужской';
    if (s === 'female') return 'Женский';
    return s;
  };

  typeIcon(type: string): string {
    const map: Record<string, string> = {
      reminder: '@tui.bell',
      recommendation: '@tui.info',
      alarm: '@tui.alert-triangle',
      expiration_reminder: '@tui.clock',
    };
    return map[type] ?? '@tui.info';
  }

  // ---- Loaders ----

  loadGroups(): void {
    this.loadingGroups = true;
    this.api.listGroups().subscribe({
      next: (res: any) => {
        this.groups = res.data || res || [];
        this.loadingGroups = false;
      },
      error: () => (this.loadingGroups = false),
    });
  }

  loadCriteria(): void {
    this.loadingCriteria = true;
    this.api.listCriteria().subscribe({
      next: (res: any) => {
        this.criteria = (res.data || res || []).sort((a: Criterion, b: Criterion) =>
          a.name.localeCompare(b.name));
        this.loadingCriteria = false;
      },
      error: () => (this.loadingCriteria = false),
    });
  }

  loadAnalyses(): void {
    this.loadingAnalyses = true;
    this.api.adminListAnalyses().subscribe({
      next: (res: any) => {
        this.analyses = (res.data || res || []).sort((a: AnalysisRow, b: AnalysisRow) => a.id - b.id);
        this.loadingAnalyses = false;
      },
      error: () => (this.loadingAnalyses = false),
    });
  }

  loadRecs(): void {
    this.loadingRecs = true;
    this.api.adminListRecommendations().subscribe({
      next: (res: any) => {
        this.recommendations = res.data || res || [];
        this.loadingRecs = false;
      },
      error: () => (this.loadingRecs = false),
    });
  }

  // ---- Recommendation CRUD ----

  editRec(r: AdminRec): void {
    this.editingRec = r;
    this.recForm = { ...r };
    this.recTextsRaw = (r.texts || []).join('\n');
    this.recError = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelRec(): void {
    this.editingRec = null;
    this.recForm = this.emptyRec();
    this.recTextsRaw = '';
    this.recError = '';
  }

  saveRec(): void {
    if (!this.recForm.criterion_id) {
      this.recError = 'Выберите критерий.';
      return;
    }
    if (!this.recForm.title?.trim()) {
      this.recError = 'Введите заголовок.';
      return;
    }
    const texts = this.recTextsRaw.split('\n').map(t => t.trim()).filter(t => t !== '');
    if (texts.length === 0) {
      this.recError = 'Добавьте хотя бы один текст уведомления.';
      return;
    }
    this.recError = '';
    this.savingRec = true;
    const payload: any = {
      ...this.recForm,
      texts,
      id: this.editingRec ? this.editingRec.id : undefined,
    };
    this.api.adminUpsertRecommendation(payload).subscribe({
      next: () => {
        this.savingRec = false;
        this.cancelRec();
        this.loadRecs();
      },
      error: (err: any) => {
        this.savingRec = false;
        this.recError = 'Ошибка: ' + (err?.error?.message || JSON.stringify(err?.error));
      },
    });
  }

  deleteRec(id: string): void {
    if (!confirm('Удалить рекомендацию?')) return;
    this.deletingRecId = id;
    this.api.adminDeleteRecommendation(id).subscribe({
      next: () => {
        this.deletingRecId = null;
        this.loadRecs();
      },
      error: () => (this.deletingRecId = null),
    });
  }

  // ---- Criterion CRUD ----

  editCrit(c: Criterion): void {
    this.editingCrit = c;
    const aid = c.analysis_id;
    this.critForm = {
      ...c,
      analysis_id: aid !== undefined && aid !== null && aid !== '' ? Number(aid) : '',
    };
    this.critMinStr = c.min_value != null ? String(c.min_value) : '';
    this.critMaxStr = c.max_value != null ? String(c.max_value) : '';
    this.critDeltaStr = c.delta != null ? String(c.delta) : '';
    this.critError = '';
    this.tab = 'criteria';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onInputTypeChange(): void {
    if (this.critForm.input_type !== 'numeric') {
      this.critMinStr = '';
      this.critMaxStr = '';
      this.critDeltaStr = '';
    }
  }

  cancelCrit(): void {
    this.editingCrit = null;
    this.critForm = this.emptyCrit();
    this.critMinStr = '';
    this.critMaxStr = '';
    this.critDeltaStr = '';
    this.critError = '';
  }

  saveCrit(): void {
    if (!this.critForm.name?.trim()) {
      this.critError = 'Введите название критерия.';
      return;
    }
    this.critError = '';
    this.savingCrit = true;
    const isNumeric = this.critForm.input_type === 'numeric';
    const aid = this.critForm.analysis_id;
    const payload: any = {
      ...this.critForm,
      id: this.editingCrit ? this.editingCrit.id : undefined,
      min_value: isNumeric && this.critMinStr !== '' ? parseFloat(this.critMinStr) : null,
      max_value: isNumeric && this.critMaxStr !== '' ? parseFloat(this.critMaxStr) : null,
      delta: isNumeric && this.critDeltaStr !== '' ? parseFloat(this.critDeltaStr) : null,
      analysis_id: aid === '' || aid === undefined || aid === null ? null : Number(aid),
    };
    this.api.adminUpsertCriterion(payload).subscribe({
      next: () => {
        this.savingCrit = false;
        this.cancelCrit();
        this.loadCriteria();
      },
      error: (err: any) => {
        this.savingCrit = false;
        this.critError = 'Ошибка: ' + (err?.error?.message || JSON.stringify(err?.error));
      },
    });
  }

  emptyAnalysis(): Partial<AnalysisRow> {
    return { name: '', instruction: '' };
  }

  editAnalysis(a: AnalysisRow): void {
    this.editingAnalysis = a;
    this.analysisForm = { ...a };
    this.analysisError = '';
    this.tab = 'analyses';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelAnalysis(): void {
    this.editingAnalysis = null;
    this.analysisForm = this.emptyAnalysis();
    this.analysisError = '';
  }

  startNewAnalysis(): void {
    this.editingAnalysis = null;
    this.analysisForm = this.emptyAnalysis();
    this.analysisError = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  saveAnalysis(): void {
    if (!this.analysisForm.name?.trim()) {
      this.analysisError = 'Введите название анализа.';
      return;
    }
    this.analysisError = '';
    this.savingAnalysis = true;
    const body: { id?: number; name: string; instruction: string } = {
      name: this.analysisForm.name!.trim(),
      instruction: (this.analysisForm.instruction || '').trim(),
    };
    if (this.editingAnalysis) {
      body.id = this.editingAnalysis.id;
    }
    this.api.adminUpsertAnalysis(body).subscribe({
      next: () => {
        this.savingAnalysis = false;
        this.cancelAnalysis();
        this.loadAnalyses();
        this.loadCriteria();
      },
      error: (err: any) => {
        this.savingAnalysis = false;
        this.analysisError = 'Ошибка: ' + (err?.error?.message || JSON.stringify(err?.error));
      },
    });
  }

  deleteAnalysis(id: number): void {
    if (!confirm('Удалить анализ? Связь с критериями будет снята.')) return;
    this.deletingAnalysisId = id;
    this.api.adminDeleteAnalysis(id).subscribe({
      next: () => {
        this.deletingAnalysisId = null;
        this.loadAnalyses();
        this.loadCriteria();
      },
      error: () => (this.deletingAnalysisId = null),
    });
  }
}
