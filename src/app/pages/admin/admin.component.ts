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
  min_value?: number;
  max_value?: number;
}

interface Criterion {
  id: string;
  group_id: string;
  name: string;
  level: number;
  sex: string;
  blocked_by: string;
  input_type: string;
  lifetime: number;
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
        <button class="tab" [class.active]="tab === 'recommendations'" (click)="tab = 'recommendations'; loadRecs()">
          💡 Рекомендации
        </button>
        <button class="tab" [class.active]="tab === 'criteria'" (click)="tab = 'criteria'">
          🔬 Критерии
        </button>
      </div>

      <!-- Recommendations tab -->
      <div *ngIf="tab === 'recommendations'">
        <section class="card">
          <h2 class="section-title">{{ editingRec ? 'Редактировать рекомендацию' : 'Новая рекомендация' }}</h2>
          <div class="form-grid">
            <div class="form-group">
              <label>ID критерия</label>
              <input [(ngModel)]="recForm.criterion_id" class="input" placeholder="UUID критерия" />
            </div>
            <div class="form-group">
              <label>Тип</label>
              <select [(ngModel)]="recForm.type" class="input">
                <option value="reminder">reminder — нет данных</option>
                <option value="recommendation">recommendation — образ жизни</option>
                <option value="alarm">alarm — тревога</option>
                <option value="expiration_reminder">expiration_reminder — срок истекает</option>
              </select>
            </div>
            <div class="form-group full">
              <label>Заголовок</label>
              <input [(ngModel)]="recForm.title" class="input" placeholder="Заголовок" />
            </div>
            <div class="form-group full">
              <label>Тексты уведомлений (по одному в строку)</label>
              <textarea [(ngModel)]="recTextsRaw" class="input textarea" rows="4" placeholder="Текст 1&#10;Текст 2&#10;Текст 3"></textarea>
            </div>
            <div class="form-group">
              <label>Базовый вес</label>
              <input [(ngModel)]="recForm.base_weight" type="number" class="input" placeholder="1" />
            </div>
            <div class="form-group">
              <label>Мин. значение</label>
              <input [(ngModel)]="recMinStr" type="text" class="input" placeholder="Не задано" />
            </div>
            <div class="form-group">
              <label>Макс. значение</label>
              <input [(ngModel)]="recMaxStr" type="text" class="input" placeholder="Не задано" />
            </div>
          </div>
          <div class="form-actions">
            <button tuiButton appearance="primary" size="m" (click)="saveRec()">
              {{ editingRec ? 'Сохранить' : 'Добавить' }}
            </button>
            <button tuiButton appearance="ghost" size="m" (click)="cancelRec()" *ngIf="editingRec">Отмена</button>
          </div>
        </section>

        <section class="card">
          <h2 class="section-title">Список рекомендаций</h2>
          <div *ngIf="loadingRecs" class="center"><tui-loader /></div>
          <div *ngIf="!loadingRecs && recommendations.length === 0" class="empty">Нет рекомендаций.</div>
          <table class="admin-table" *ngIf="recommendations.length > 0">
            <thead>
              <tr>
                <th>Критерий</th>
                <th>Тип</th>
                <th>Заголовок</th>
                <th>Вес</th>
                <th>Диапазон</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let r of recommendations">
                <td class="mono">{{ r.criterion_id | slice:0:8 }}…</td>
                <td><span class="type-badge type-{{ r.type }}">{{ r.type }}</span></td>
                <td>{{ r.title }}</td>
                <td>{{ r.base_weight }}</td>
                <td>{{ formatRange(r) }}</td>
                <td class="actions">
                  <button tuiButton size="xs" appearance="ghost" (click)="editRec(r)">✏️</button>
                  <button tuiButton size="xs" appearance="destructive" (click)="deleteRec(r.id)">🗑️</button>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>

      <!-- Criteria tab -->
      <div *ngIf="tab === 'criteria'">
        <section class="card">
          <h2 class="section-title">{{ editingCrit ? 'Редактировать критерий' : 'Новый критерий' }}</h2>
          <div class="form-grid">
            <div class="form-group full">
              <label>Название</label>
              <input [(ngModel)]="critForm.name" class="input" placeholder="Название показателя" />
            </div>
            <div class="form-group">
              <label>ID группы</label>
              <input [(ngModel)]="critForm.group_id" class="input" placeholder="UUID группы" />
            </div>
            <div class="form-group">
              <label>Уровень (1/2/3)</label>
              <input [(ngModel)]="critForm.level" type="number" class="input" />
            </div>
            <div class="form-group">
              <label>Тип ввода</label>
              <select [(ngModel)]="critForm.input_type" class="input">
                <option value="numeric">numeric</option>
                <option value="check">check</option>
                <option value="boolean">boolean</option>
              </select>
            </div>
            <div class="form-group">
              <label>Пол (пусто = все)</label>
              <select [(ngModel)]="critForm.sex" class="input">
                <option value="">Все</option>
                <option value="male">male</option>
                <option value="female">female</option>
              </select>
            </div>
            <div class="form-group">
              <label>Срок хранения (дней)</label>
              <input [(ngModel)]="critForm.lifetime" type="number" class="input" placeholder="0 = бессрочно" />
            </div>
            <div class="form-group">
              <label>Порядок сортировки</label>
              <input [(ngModel)]="critForm.sort_order" type="number" class="input" />
            </div>
            <div class="form-group">
              <label>blocked_by</label>
              <input [(ngModel)]="critForm.blocked_by" class="input" placeholder="level_1 / criteria_uuid" />
            </div>
          </div>
          <div class="form-actions">
            <button tuiButton appearance="primary" size="m" (click)="saveCrit()">
              {{ editingCrit ? 'Сохранить' : 'Добавить' }}
            </button>
            <button tuiButton appearance="ghost" size="m" (click)="cancelCrit()" *ngIf="editingCrit">Отмена</button>
          </div>
        </section>
      </div>
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

    .page-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }

    .card {
      background: white;
      border-radius: 1rem;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }

    .section-title {
      font-size: 1rem;
      font-weight: 700;
      margin: 0 0 1.25rem;
      color: #0f172a;
    }

    .tabs { display: flex; gap: 0.5rem; }

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
    .tab.active { background: #0284c7; color: white; border-color: #0284c7; font-weight: 600; }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .form-group { display: flex; flex-direction: column; gap: 0.25rem; }
    .form-group.full { grid-column: 1 / -1; }

    label { font-size: 0.8rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; }

    .input {
      padding: 0.5rem 0.75rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      font-size: 0.9rem;
      transition: border-color 0.15s;
      width: 100%;
      box-sizing: border-box;
    }

    .input:focus { border-color: #0284c7; outline: none; }
    .textarea { resize: vertical; font-family: inherit; }

    .form-actions { display: flex; gap: 0.75rem; margin-top: 1.25rem; }

    .admin-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    .admin-table th {
      text-align: left;
      padding: 0.5rem 0.75rem;
      color: #94a3b8;
      font-weight: 500;
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      border-bottom: 1px solid #f1f5f9;
    }

    .admin-table td {
      padding: 0.75rem;
      border-bottom: 1px solid #f8fafc;
      vertical-align: middle;
    }

    .admin-table tr:hover { background: #f8fafc; }

    .mono { font-family: monospace; font-size: 0.8rem; color: #64748b; }

    .type-badge {
      display: inline-block;
      padding: 0.2rem 0.5rem;
      border-radius: 0.375rem;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .type-reminder            { background: #fef3c7; color: #92400e; }
    .type-recommendation      { background: #dbeafe; color: #1e40af; }
    .type-alarm               { background: #fee2e2; color: #991b1b; }
    .type-expiration_reminder { background: #f3e8ff; color: #7c3aed; }

    .actions { display: flex; gap: 0.5rem; }
    .center { display: flex; justify-content: center; padding: 2rem; }
    .empty { text-align: center; color: #94a3b8; padding: 2rem; }
  `],
})
export class AdminComponent implements OnInit {
  private api = inject(ApiService);

  tab = 'recommendations';
  loadingRecs = false;

  recommendations: AdminRec[] = [];
  editingRec: AdminRec | null = null;

  recForm: Partial<AdminRec> = this.emptyRec();
  recTextsRaw = '';
  recMinStr = '';
  recMaxStr = '';

  editingCrit = false;
  critForm: Partial<Criterion> = this.emptyCrit();

  ngOnInit(): void {
    this.loadRecs();
  }

  emptyRec(): Partial<AdminRec> {
    return { type: 'recommendation', base_weight: 1, texts: [] };
  }

  emptyCrit(): Partial<Criterion> {
    return { level: 1, input_type: 'numeric', lifetime: 0, sort_order: 0 };
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

  editRec(r: AdminRec): void {
    this.editingRec = r;
    this.recForm = { ...r };
    this.recTextsRaw = (r.texts || []).join('\n');
    this.recMinStr = r.min_value !== undefined ? String(r.min_value) : '';
    this.recMaxStr = r.max_value !== undefined ? String(r.max_value) : '';
  }

  cancelRec(): void {
    this.editingRec = null;
    this.recForm = this.emptyRec();
    this.recTextsRaw = '';
    this.recMinStr = '';
    this.recMaxStr = '';
  }

  saveRec(): void {
    const texts = this.recTextsRaw.split('\n').map(t => t.trim()).filter(t => t !== '');
    const payload: any = {
      ...this.recForm,
      texts,
      min_value: this.recMinStr !== '' ? parseFloat(this.recMinStr) : undefined,
      max_value: this.recMaxStr !== '' ? parseFloat(this.recMaxStr) : undefined,
    };
    if (this.editingRec) {
      payload.id = this.editingRec.id;
    }
    this.api.adminUpsertRecommendation(payload).subscribe({
      next: () => {
        this.cancelRec();
        this.loadRecs();
      },
      error: (err: any) => alert('Ошибка: ' + JSON.stringify(err.error)),
    });
  }

  deleteRec(id: string): void {
    if (!confirm('Удалить рекомендацию?')) return;
    this.api.adminDeleteRecommendation(id).subscribe({
      next: () => this.loadRecs(),
    });
  }

  editCrit(c: Criterion): void {
    this.editingCrit = true;
    this.critForm = { ...c };
  }

  cancelCrit(): void {
    this.editingCrit = false;
    this.critForm = this.emptyCrit();
  }

  saveCrit(): void {
    this.api.adminUpsertCriterion(this.critForm).subscribe({
      next: () => {
        this.cancelCrit();
        alert('Критерий сохранён!');
      },
      error: (err: any) => alert('Ошибка: ' + JSON.stringify(err.error)),
    });
  }

  formatRange(r: AdminRec): string {
    if (r.min_value === undefined && r.max_value === undefined) return 'любое';
    const min = r.min_value !== undefined ? r.min_value : '−∞';
    const max = r.max_value !== undefined ? r.max_value : '+∞';
    return `[${min}; ${max})`;
  }
}
