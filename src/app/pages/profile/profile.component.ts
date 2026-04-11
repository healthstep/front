import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TuiButton, TuiLoader, TuiTextfield, TuiIcon } from '@taiga-ui/core';
import { NavComponent } from '../../shared/nav/nav.component';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, TuiButton, TuiLoader, TuiIcon, NavComponent, FormsModule, TuiTextfield],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
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
