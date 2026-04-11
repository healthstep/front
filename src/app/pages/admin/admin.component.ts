import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TuiButton, TuiLoader } from '@taiga-ui/core';
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

interface Group {
  id: string;
  name: string;
  sort_order: number;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, TuiButton, TuiLoader, NavComponent],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
})
export class AdminComponent implements OnInit {
  private api = inject(ApiService);

  tab = 'recommendations';

  // Data
  recommendations: AdminRec[] = [];
  criteria: Criterion[] = [];
  groups: Group[] = [];

  // Loading states
  loadingGroups = false;
  loadingRecs = false;
  loadingCriteria = false;
  savingRec = false;
  savingCrit = false;
  deletingRecId: string | null = null;

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

  ngOnInit(): void {
    this.loadGroups();
    this.loadCriteria();
    this.loadRecs();
  }

  switchTab(tab: string): void {
    this.tab = tab;
    this.cancelRec();
    this.cancelCrit();
  }

  // ---- Helpers ----

  emptyRec(): Partial<AdminRec> {
    return { type: 'recommendation', base_weight: 1, texts: [] };
  }

  emptyCrit(): Partial<Criterion> {
    return { level: 1, input_type: 'numeric', lifetime: 0, sort_order: 0, sex: '' };
  }

  criterionName(id: string): string {
    return this.criteria.find(c => c.id === id)?.name ?? id.slice(0, 8) + '…';
  }

  groupName(id: string): string {
    return this.groups.find(g => g.id === id)?.name ?? '';
  }

  typeLabel(type: string): string {
    const map: Record<string, string> = {
      reminder: '🔔 reminder',
      recommendation: '💡 recommend.',
      alarm: '🚨 alarm',
      expiration_reminder: '⏰ expiry',
    };
    return map[type] ?? type;
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
    this.critForm = { ...c };
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
    const payload: any = {
      ...this.critForm,
      id: this.editingCrit ? this.editingCrit.id : undefined,
      min_value: isNumeric && this.critMinStr !== '' ? parseFloat(this.critMinStr) : null,
      max_value: isNumeric && this.critMaxStr !== '' ? parseFloat(this.critMaxStr) : null,
      delta: isNumeric && this.critDeltaStr !== '' ? parseFloat(this.critDeltaStr) : null,
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
}
