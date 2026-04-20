import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TuiRoot } from '@taiga-ui/core';
import { AuthService } from './core/services/auth.service';
import { SeoService } from './core/seo/seo.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, TuiRoot],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  /** Поднимает SeoService (подписка на маршрут + первый снимок meta для роботов). */
  private readonly _seo = inject(SeoService);
  private readonly auth = inject(AuthService);

  ngOnInit(): void {
    const t = this.auth.getToken();
    if (t && this.auth.isJwtExpired(t)) {
      this.auth.clearAuth();
    }
  }
}
