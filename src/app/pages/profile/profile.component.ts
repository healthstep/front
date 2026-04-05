import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TuiButton, TuiLoader, TuiTextfield } from '@taiga-ui/core';
import { NavComponent } from '../../shared/nav/nav.component';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, TuiButton, TuiLoader, NavComponent, FormsModule, TuiTextfield],
  template: `
    <app-nav />
    <div class="page">
      <div class="card">
        <h2 class="page-title">👤 Профиль</h2>

        @if (loading) {
          <tui-loader />
        }

        @if (!loading && user) {
          <div class="profile-avatar">
            <div class="avatar-circle">{{ initials }}</div>
          </div>

          <div class="profile-info">
            <div class="field-group">
              <label class="field-label">Имя</label>
              @if (editingName) {
                <div class="field-edit">
                  <input tuiTextfield [(ngModel)]="displayName" type="text" />
                  <button tuiButton size="s" appearance="primary" (click)="saveName()" [disabled]="saving">
                    Сохранить
                  </button>
                  <button tuiButton size="s" appearance="ghost" (click)="cancelNameEdit()">Отмена</button>
                </div>
              } @else {
                <div class="field-value">
                  <span>{{ user.display_name || 'Не указано' }}</span>
                  <button tuiButton size="xs" appearance="ghost" (click)="editingName = true">✏️</button>
                </div>
              }
            </div>

            <div class="field-group">
              <label class="field-label">Телефон</label>
              <div class="field-value">
                <span>{{ user.phone_e164 || '—' }}</span>
              </div>
            </div>

            <div class="field-group">
              <label class="field-label">Дата рождения</label>
              @if (editingBirth) {
                <div class="field-edit">
                  <input tuiTextfield [(ngModel)]="birthDate" type="date" />
                  <button tuiButton size="s" appearance="primary" (click)="saveBirth()" [disabled]="saving">Сохранить</button>
                  <button tuiButton size="s" appearance="ghost" (click)="cancelBirthEdit()">Отмена</button>
                </div>
              } @else {
                <div class="field-value">
                  <span>{{ user.birth_date || 'Не указана' }}</span>
                  <button tuiButton size="xs" appearance="ghost" (click)="startBirthEdit()">✏️</button>
                </div>
              }
            </div>

            <div class="field-group">
              <label class="field-label">Пол</label>
              @if (editingSex) {
                <div class="field-edit">
                  <select [(ngModel)]="sex" class="sex-select">
                    <option value="">Не указан</option>
                    <option value="male">Мужской</option>
                    <option value="female">Женский</option>
                  </select>
                  <button tuiButton size="s" appearance="primary" (click)="saveSex()" [disabled]="saving">Сохранить</button>
                  <button tuiButton size="s" appearance="ghost" (click)="editingSex = false">Отмена</button>
                </div>
              } @else {
                <div class="field-value">
                  <span>{{ sexLabel(user.sex) }}</span>
                  <button tuiButton size="xs" appearance="ghost" (click)="editingSex = true">✏️</button>
                </div>
              }
            </div>
          </div>

          @if (saveError) {
            <p class="error">{{ saveError }}</p>
          }

          @if (saveSuccess) {
            <p class="success">✅ Профиль обновлён!</p>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .page {
      max-width: 600px;
      margin: 0 auto;
      padding: 1.5rem 1rem 3rem;
    }

    .card {
      background: white;
      border-radius: 1rem;
      padding: 2rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }

    .page-title {
      font-size: 1.25rem;
      font-weight: 700;
      margin: 0 0 2rem;
      color: #0f172a;
    }

    .profile-avatar {
      display: flex;
      justify-content: center;
      margin-bottom: 2rem;
    }

    .avatar-circle {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: linear-gradient(135deg, #0ea5e9, #0284c7);
      color: white;
      font-size: 1.75rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .profile-info { display: flex; flex-direction: column; gap: 1.25rem; }

    .field-group { display: flex; flex-direction: column; gap: 0.375rem; }

    .field-label {
      font-size: 0.8rem;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .field-value {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1rem;
      color: #1e293b;
    }

    .field-edit {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      flex-wrap: wrap;
    }

    .sex-select {
      padding: 0.5rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      font-size: 0.9rem;
    }

    .error { color: #dc2626; font-size: 0.875rem; margin-top: 1rem; }
    .success { color: #16a34a; font-size: 0.875rem; margin-top: 1rem; }
  `],
})
export class ProfileComponent implements OnInit {
  private api = inject(ApiService);

  loading = true;
  saving = false;
  user: any = null;

  editingName = false;
  editingBirth = false;
  editingSex = false;

  displayName = '';
  birthDate = '';
  sex = '';

  saveError: string | null = null;
  saveSuccess = false;

  get initials(): string {
    if (!this.user?.display_name) return '?';
    return this.user.display_name
      .split(' ')
      .slice(0, 2)
      .map((w: string) => w[0])
      .join('')
      .toUpperCase();
  }

  ngOnInit(): void {
    this.api.getMe().subscribe({
      next: (res: any) => {
        this.user = res.data || res;
        this.displayName = this.user.display_name || '';
        this.birthDate = this.user.birth_date || '';
        this.sex = this.user.sex || '';
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  saveName(): void {
    this.save({ display_name: this.displayName }).then(() => {
      this.user.display_name = this.displayName;
      this.editingName = false;
    });
  }

  cancelNameEdit(): void {
    this.displayName = this.user.display_name || '';
    this.editingName = false;
  }

  startBirthEdit(): void {
    this.birthDate = this.user.birth_date || '';
    this.editingBirth = true;
  }

  saveBirth(): void {
    this.save({ birth_date: this.birthDate }).then(() => {
      this.user.birth_date = this.birthDate;
      this.editingBirth = false;
    });
  }

  cancelBirthEdit(): void {
    this.birthDate = this.user.birth_date || '';
    this.editingBirth = false;
  }

  saveSex(): void {
    this.save({ sex: this.sex }).then(() => {
      this.user.sex = this.sex;
      this.editingSex = false;
    });
  }

  private async save(data: any): Promise<void> {
    this.saving = true;
    this.saveError = null;
    this.saveSuccess = false;

    return new Promise(resolve => {
      this.api.updateMe(data).subscribe({
        next: () => {
          this.saving = false;
          this.saveSuccess = true;
          setTimeout(() => (this.saveSuccess = false), 3000);
          resolve();
        },
        error: () => {
          this.saving = false;
          this.saveError = 'Не удалось сохранить изменения';
          resolve();
        },
      });
    });
  }

  sexLabel(sex: string): string {
    if (sex === 'male') return 'Мужской';
    if (sex === 'female') return 'Женский';
    return 'Не указан';
  }
}
