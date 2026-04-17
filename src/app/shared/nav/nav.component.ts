import { Component, OnInit, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TuiButton, TuiLoader, TuiIcon } from '@taiga-ui/core';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TuiButton, TuiLoader, TuiIcon, CommonModule],
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.scss',
})
export class NavComponent implements OnInit {
  private auth = inject(AuthService);
  private api = inject(ApiService);

  isAdmin = false;
  navLoading = false;

  get loggedIn(): boolean {
    return this.auth.isAuthenticated();
  }

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) {
      this.navLoading = true;
      this.api.getMe().subscribe({
        next: (res: any) => {
          const u = res.data || res;
          this.isAdmin = u?.is_admin === true;
          this.navLoading = false;
        },
        error: () => {
          this.navLoading = false;
        },
      });
    }
  }

}
