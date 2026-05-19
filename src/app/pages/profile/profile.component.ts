import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TuiButton, TuiLoader, TuiIcon, TuiTextfield, TuiInput, TuiLabel } from '@taiga-ui/core';
import { TuiDay } from '@taiga-ui/cdk/date-time';
import { TuiInputDate } from '@taiga-ui/kit/components/input-date';
import { NavComponent } from '../../shared/nav/nav.component';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    TuiButton,
    TuiLoader,
    TuiIcon,
    TuiTextfield,
    TuiInput,
    TuiLabel,
    ...TuiInputDate,
    NavComponent,
    FormsModule,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  loading = true;
  saving = false;
  user: any = null;

  editingName = false;
  editingBirth = false;
  editingSex = false;

  displayName = '';
  birthDate = '';
  /** Модель для `tuiInputDate` (дата рождения). */
  birthDateDay: TuiDay | null = null;
  sex = '';

  advanced = false;
  savingAdvanced = false;

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
        this.advanced = !!this.user.advanced;
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
    this.birthDateDay = this.parseYmdToDay(this.user.birth_date);
    this.editingBirth = true;
  }

  saveBirth(): void {
    const birth_date = this.birthDateDay?.toJSON() ?? '';
    this.save({ birth_date }).then(() => {
      this.user.birth_date = birth_date;
      this.birthDate = birth_date;
      this.editingBirth = false;
    });
  }

  cancelBirthEdit(): void {
    this.birthDateDay = this.parseYmdToDay(this.user.birth_date);
    this.birthDate = this.user.birth_date || '';
    this.editingBirth = false;
  }

  private parseYmdToDay(ymd: string | null | undefined): TuiDay | null {
    const s = (ymd || '').trim();
    if (!s) return null;
    try {
      return TuiDay.jsonParse(s);
    } catch {
      return null;
    }
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

  toggleAdvanced(): void {
    this.savingAdvanced = true;
    this.api.updateMe({ advanced: this.advanced }).subscribe({
      next: () => {
        this.user.advanced = this.advanced;
        this.savingAdvanced = false;
      },
      error: () => {
        this.advanced = !this.advanced;
        this.savingAdvanced = false;
      },
    });
  }

  logout(): void {
    this.auth.logout();
  }
}
