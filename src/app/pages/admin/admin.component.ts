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
  template: `
    <app-nav />
    <div class="page">
      <h1 class="page-title">⚙️ Панель администратора</h1>

      <!-- Tabs -->
      <div class="tabs">
        <button class="tab" [class.active]="tab === 'recommendations'" (click)="switchTab('recommendations')">
          💡 Рекомендации
        </button>
        <button class="tab" [class.active]="tab === 'criteria'" (click)="switchTab('criteria')">
          🔬 Критерии
        </button>
      </div>

      <!-- ===== Recommendations tab ===== -->
      <ng-container *ngIf="tab === 'recommendations'">

        <!-- Form card -->
        <section class="card form-card">
          <h2 class="section-title">{{ editingRec ? '✏️ Редактировать рекомендацию' : '➕ Новая рекомендация' }}</h2>
          <div class="form-grid">

            <div class="form-group">
              <label>Критерий</label>
              @if (loadingCriteria && criteria.length === 0) {
                <div class="field-loader"><tui-loader size="xs" /></div>
              }
              @if (!(loadingCriteria && criteria.length === 0)) {
                <select [(ngModel)]="recForm.criterion_id" class="input">
                  <option value="">— выберите критерий —</option>
                  <option *ngFor="let c of criteria" [value]="c.id">{{ c.name }}</option>
                </select>
              }
            </div>

            <div class="form-group">
              <label>Тип</label>
              <select [(ngModel)]="recForm.type" class="input">
                <option value="reminder">🔔 reminder — нет данных</option>
                <option value="recommendation">💡 recommendation — образ жизни</option>
                <option value="alarm">🚨 alarm — тревога (критично)</option>
                <option value="expiration_reminder">⏰ expiration_reminder — срок истекает</option>
              </select>
            </div>

            <div class="form-group full">
              <label>Заголовок</label>
              <input [(ngModel)]="recForm.title" class="input" placeholder="Например: Питание для повышения гемоглобина" />
            </div>

            <div class="form-group full">
              <label>Тексты уведомлений <span class="hint">(один вариант на строку)</span></label>
              <textarea [(ngModel)]="recTextsRaw" class="input textarea" rows="4"
                placeholder="Текст первого уведомления&#10;Текст второго уведомления&#10;..."></textarea>
            </div>

            <div class="form-group">
              <label>Базовый вес аукциона</label>
              <input [(ngModel)]="recForm.base_weight" type="number" min="1" class="input" placeholder="1–10" />
            </div>

          </div>
          <div class="form-actions">
            <button tuiButton appearance="primary" size="m" [disabled]="savingRec" (click)="saveRec()">
              <tui-loader *ngIf="savingRec" size="xs" />
              {{ editingRec ? 'Сохранить изменения' : 'Добавить рекомендацию' }}
            </button>
            <button tuiButton appearance="ghost" size="m" (click)="cancelRec()" *ngIf="editingRec">Отмена</button>
          </div>
          <p class="error" *ngIf="recError">{{ recError }}</p>
        </section>

        <!-- List card -->
        <section class="card">
          <div class="card-header">
            <h2 class="section-title">Список рекомендаций</h2>
            <button tuiButton appearance="ghost" size="s" (click)="loadRecs()">🔄 Обновить</button>
          </div>
          <div *ngIf="loadingRecs" class="center"><tui-loader /></div>
          <div *ngIf="!loadingRecs && recommendations.length === 0" class="empty">Нет рекомендаций.</div>
          <div class="rec-list" *ngIf="!loadingRecs && recommendations.length > 0">
            <div class="rec-item" *ngFor="let r of recommendations">
              <div class="rec-header">
                <span class="type-badge type-{{ r.type }}">{{ typeLabel(r.type) }}</span>
                <strong>{{ r.title }}</strong>
                <span class="crit-name">{{ criterionName(r.criterion_id) }}</span>
              </div>
              <div class="rec-texts" *ngIf="r.texts?.length">
                <span class="text-preview" *ngFor="let t of r.texts.slice(0, 2)">{{ t }}</span>
                <span class="text-more" *ngIf="r.texts.length > 2">+{{ r.texts.length - 2 }} ещё</span>
              </div>
              <div class="rec-actions">
                <button tuiButton size="xs" appearance="ghost" (click)="editRec(r)">✏️ Изменить</button>
                <button tuiButton size="xs" appearance="destructive" [disabled]="deletingRecId === r.id" (click)="deleteRec(r.id)">
                  @if (deletingRecId === r.id) { <tui-loader size="xs" /> } @else { 🗑️ Удалить }
                </button>
              </div>
            </div>
          </div>
        </section>
      </ng-container>

      <!-- ===== Criteria tab ===== -->
      <ng-container *ngIf="tab === 'criteria'">

        <!-- Form card -->
        <section class="card form-card">
          <h2 class="section-title">{{ editingCrit ? '✏️ Редактировать критерий' : '➕ Новый критерий' }}</h2>
          <div class="form-grid">

            <div class="form-group full">
              <label>Название</label>
              <input [(ngModel)]="critForm.name" class="input" placeholder="Например: Гемоглобин" />
            </div>

            <div class="form-group">
              <label>Группа</label>
              @if (loadingGroups && groups.length === 0) {
                <div class="field-loader"><tui-loader size="xs" /></div>
              }
              @if (!(loadingGroups && groups.length === 0)) {
                <select [(ngModel)]="critForm.group_id" class="input">
                  <option value="">— без группы —</option>
                  <option *ngFor="let g of groups" [value]="g.id">{{ g.name }}</option>
                </select>
              }
            </div>

            <div class="form-group">
              <label>Уровень (1/2/3)</label>
              <input [(ngModel)]="critForm.level" type="number" min="1" max="3" class="input" />
            </div>

            <div class="form-group">
              <label>Тип ввода</label>
              <select [(ngModel)]="critForm.input_type" (ngModelChange)="onInputTypeChange()" class="input">
                <option value="numeric">numeric — число</option>
                <option value="check">check — факт (есть/нет)</option>
                <option value="boolean">boolean — результат (+ / −)</option>
              </select>
            </div>

            <div class="form-group">
              <label>Пол</label>
              <select [(ngModel)]="critForm.sex" class="input">
                <option value="">Все</option>
                <option value="male">Мужской</option>
                <option value="female">Женский</option>
              </select>
            </div>

            <div class="form-group">
              <label>Срок (дней, 0 = бессрочно)</label>
              <input [(ngModel)]="critForm.lifetime" type="number" min="0" class="input" />
            </div>

            <div class="form-group">
              <label>Порядок сортировки</label>
              <input [(ngModel)]="critForm.sort_order" type="number" min="0" class="input" />
            </div>

            <!-- Input type description -->
            <div class="form-group full input-type-desc" *ngIf="critForm.input_type">
              <div class="type-info" [ngClass]="'info-' + critForm.input_type">
                <ng-container *ngIf="critForm.input_type === 'numeric'">
                  📊 <strong>numeric</strong> — пользователь вводит число. Укажите ниже диапазон нормы.
                </ng-container>
                <ng-container *ngIf="critForm.input_type === 'check'">
                  ✅ <strong>check</strong> — пользователь отмечает, сделал ли он это (например, посетил врача).
                  «+» сохраняется, «−» игнорируется. Дополнительных полей не требуется.
                </ng-container>
                <ng-container *ngIf="critForm.input_type === 'boolean'">
                  🔵 <strong>boolean</strong> — бинарный результат: «+» положительный (норма), «−» отрицательный
                  (автоматически запускает рекомендацию-тревогу). Дополнительных полей не требуется.
                </ng-container>
              </div>
            </div>

            <!-- Normal range — numeric ONLY -->
            <ng-container *ngIf="critForm.input_type === 'numeric'">
              <div class="form-group section-divider full">
                <span class="divider-label">Диапазон нормы</span>
              </div>

              <div class="form-group">
                <label>Норма: минимум</label>
                <input [(ngModel)]="critMinStr" type="text" class="input" placeholder="Не задано" />
              </div>

              <div class="form-group">
                <label>Норма: максимум</label>
                <input [(ngModel)]="critMaxStr" type="text" class="input" placeholder="Не задано" />
              </div>

              <div class="form-group">
                <label>Дельта (некритичное отклонение, δ)</label>
                <input [(ngModel)]="critDeltaStr" type="text" class="input" placeholder="Не задано" />
              </div>

              <div class="form-group norm-hint">
                <p class="hint-text">
                  <strong>Норма:</strong> [мин; макс]<br>
                  <strong>Предупреждение:</strong> [мин−δ; мин) или (макс; макс+δ]<br>
                  <strong>Тревога:</strong> &lt; мин−δ или &gt; макс+δ
                </p>
              </div>
            </ng-container>

          </div>
          <div class="form-actions">
            <button tuiButton appearance="primary" size="m" [disabled]="savingCrit" (click)="saveCrit()">
              <tui-loader *ngIf="savingCrit" size="xs" />
              {{ editingCrit ? 'Сохранить изменения' : 'Добавить критерий' }}
            </button>
            <button tuiButton appearance="ghost" size="m" (click)="cancelCrit()" *ngIf="editingCrit">Отмена</button>
          </div>
          <p class="error" *ngIf="critError">{{ critError }}</p>
        </section>

        <!-- Criteria list card -->
        <section class="card">
          <div class="card-header">
            <h2 class="section-title">Список критериев</h2>
            <button tuiButton appearance="ghost" size="s" (click)="loadCriteria()">🔄 Обновить</button>
          </div>
          <div *ngIf="loadingCriteria" class="center"><tui-loader /></div>
          <div *ngIf="!loadingCriteria && criteria.length === 0" class="empty">Нет критериев.</div>
          <div class="crit-list" *ngIf="!loadingCriteria && criteria.length > 0">
            <div class="crit-item" *ngFor="let c of criteria">
              <div class="crit-header">
                <strong>{{ c.name }}</strong>
                <span class="badge badge-level">L{{ c.level }}</span>
                <span class="badge badge-type">{{ c.input_type }}</span>
                <span class="badge badge-group">{{ groupName(c.group_id) }}</span>
                <span class="badge badge-sex" *ngIf="c.sex">{{ c.sex }}</span>
              </div>
              <div class="crit-meta" *ngIf="c.min_value != null || c.max_value != null">
                Норма: {{ c.min_value ?? '−∞' }} – {{ c.max_value ?? '+∞' }}
                <span *ngIf="c.delta != null"> ± {{ c.delta }}</span>
              </div>
              <div class="rec-actions">
                <button tuiButton size="xs" appearance="ghost" (click)="editCrit(c)">✏️ Изменить</button>
              </div>
            </div>
          </div>
        </section>
      </ng-container>
    </div>
  `,
  styles: [`
    .page {
      max-width: 900px;
      margin: 0 auto;
      padding: 1.5rem 1rem 4rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .page-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }

    .tabs { display: flex; gap: 0.5rem; }

    .tab {
      padding: 0.5rem 1.25rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      background: white;
      color: #64748b;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.15s;
    }

    .tab:hover { background: #f1f5f9; }
    .tab.active { background: #0284c7; color: white; border-color: #0284c7; font-weight: 600; }

    .card {
      background: white;
      border-radius: 1rem;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }

    .form-card {
      border: 2px solid #e0f2fe;
      box-shadow: 0 4px 16px rgba(2, 132, 199, 0.08);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
    }

    .section-title {
      font-size: 1rem;
      font-weight: 700;
      margin: 0 0 1.25rem;
      color: #0f172a;
    }

    .card-header .section-title { margin-bottom: 0; }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .form-group { display: flex; flex-direction: column; gap: 0.25rem; }
    .form-group.full { grid-column: 1 / -1; }

    label {
      font-size: 0.78rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .hint {
      font-weight: 400;
      text-transform: none;
      color: #94a3b8;
    }

    .input {
      padding: 0.5rem 0.75rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      font-size: 0.9rem;
      transition: border-color 0.15s;
      width: 100%;
      box-sizing: border-box;
      background: white;
    }

    .input:focus { border-color: #0284c7; outline: none; box-shadow: 0 0 0 3px rgba(2,132,199,0.1); }
    .textarea { resize: vertical; font-family: inherit; min-height: 90px; }

    .form-actions { display: flex; gap: 0.75rem; margin-top: 1.25rem; align-items: center; }

    .section-divider {
      padding-top: 0.5rem;
      border-top: 1px solid #f1f5f9;
    }

    .divider-label {
      font-size: 0.78rem;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .input-type-desc { margin-bottom: 0.25rem; }

    .type-info {
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      line-height: 1.5;
    }

    .info-numeric  { background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; }
    .info-check    { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
    .info-boolean  { background: #f5f3ff; color: #5b21b6; border: 1px solid #ddd6fe; }

    .norm-hint {
      grid-column: 2 / 3;
      justify-content: center;
    }

    .hint-text {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      padding: 0.75rem;
      font-size: 0.8rem;
      color: #64748b;
      line-height: 1.6;
      margin: 0;
    }

    /* Recommendations list */
    .rec-list { display: flex; flex-direction: column; gap: 0.75rem; }

    .rec-item {
      padding: 1rem;
      border: 1px solid #f1f5f9;
      border-radius: 0.75rem;
      transition: border-color 0.15s;
    }

    .rec-item:hover { border-color: #e0f2fe; }

    .rec-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-bottom: 0.5rem;
    }

    .rec-header strong { flex: 1; font-size: 0.95rem; color: #0f172a; }

    .crit-name { font-size: 0.8rem; color: #64748b; }

    .rec-texts {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      margin-bottom: 0.75rem;
    }

    .text-preview {
      font-size: 0.82rem;
      color: #475569;
      padding: 0.25rem 0.5rem;
      background: #f8fafc;
      border-radius: 0.375rem;
      border-left: 3px solid #bfdbfe;
    }

    .text-more { font-size: 0.8rem; color: #94a3b8; }

    .rec-actions { display: flex; gap: 0.5rem; }

    .type-badge {
      display: inline-block;
      padding: 0.2rem 0.5rem;
      border-radius: 0.375rem;
      font-size: 0.75rem;
      font-weight: 600;
      white-space: nowrap;
    }

    .type-reminder            { background: #fef3c7; color: #92400e; }
    .type-recommendation      { background: #dbeafe; color: #1e40af; }
    .type-alarm               { background: #fee2e2; color: #991b1b; }
    .type-expiration_reminder { background: #f3e8ff; color: #7c3aed; }

    /* Criteria list */
    .crit-list { display: flex; flex-direction: column; gap: 0.5rem; }

    .crit-item {
      padding: 0.875rem 1rem;
      border: 1px solid #f1f5f9;
      border-radius: 0.75rem;
      transition: border-color 0.15s;
    }

    .crit-item:hover { border-color: #e0f2fe; }

    .crit-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-bottom: 0.25rem;
    }

    .crit-header strong { flex: 1; font-size: 0.95rem; color: #0f172a; }

    .crit-meta {
      font-size: 0.8rem;
      color: #64748b;
      margin-bottom: 0.5rem;
    }

    .badge {
      padding: 0.15rem 0.5rem;
      border-radius: 0.375rem;
      font-size: 0.72rem;
      font-weight: 600;
    }

    .badge-level { background: #e0f2fe; color: #0284c7; }
    .badge-type  { background: #f0fdf4; color: #16a34a; }
    .badge-group { background: #f5f3ff; color: #7c3aed; }
    .badge-sex   { background: #fdf2f8; color: #db2777; }

    .center { display: flex; justify-content: center; padding: 2rem; }
    .empty { text-align: center; color: #94a3b8; padding: 2rem; }

    .error { color: #dc2626; font-size: 0.875rem; margin: 0.5rem 0 0; }

    .field-loader { display: flex; padding: 0.5rem 0; min-height: 2.25rem; align-items: center; }
  `],
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
