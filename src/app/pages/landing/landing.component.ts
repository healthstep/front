import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TuiButton, TuiIcon } from '@taiga-ui/core';
import { NavComponent } from '../../shared/nav/nav.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, TuiButton, TuiIcon, NavComponent],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
})
export class LandingComponent {
  currentYear = new Date().getFullYear();

  /** Ссылка на чат/поддержку в MAX (текст ссылки в футере — «Поддержка в MAX»). */
  maxSupportUrl =
    'https://max.ru/u/f9LHodD0cOLxkMmVG0wzPTBaZMvQnAzpf218aUirNk7E2Pm5fDkTHqQMOgQ';

  /** Замените на рабочий t.me-ник при появлении. */
  telegramSupportUrl = 'https://t.me/healthstep_support';
}
