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
}
