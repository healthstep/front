import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TuiButton } from '@taiga-ui/core';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, TuiButton],
  template: `
    <div class="landing">
      <header class="hero">
        <div class="hero-content">
          <h1 class="hero-title">ЗдравоШаг</h1>
          <p class="hero-subtitle">
            Следите за здоровьем просто и удобно. Напоминания об анализах, расшифровка результатов, прогресс.
          </p>
          <div class="hero-actions">
            <a tuiButton appearance="primary" size="l" routerLink="/auth">
              Войти
            </a>
          </div>
        </div>
      </header>

      <section class="features">
        <h2 class="section-title">Как это работает</h2>
        <div class="feature-grid">
          <div class="feature-card">
            <div class="feature-icon">📋</div>
            <h3>Напоминания</h3>
            <p>Система следит за сроками анализов и обследований. Напомним, когда пора.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">📊</div>
            <h3>Результаты</h3>
            <p>Загрузите результаты анализов — получите расшифровку и рекомендации.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🏆</div>
            <h3>Прогресс</h3>
            <p>Уровни растут автоматически по мере заполнения данных о здоровье.</p>
          </div>
        </div>
      </section>

      <section class="levels">
        <h2 class="section-title">Уровни</h2>
        <div class="level-grid">
          <div class="level-card">
            <span class="level-badge level-green">🟢</span>
            <h3>Нормис</h3>
            <p>Базовый набор анализов</p>
          </div>
          <div class="level-card">
            <span class="level-badge level-yellow">🟡</span>
            <h3>Сын маминой подруги</h3>
            <p>Расширенный чекап</p>
          </div>
          <div class="level-card">
            <span class="level-badge level-red">🔥</span>
            <h3>Гига чад</h3>
            <p>Полный контроль здоровья</p>
          </div>
        </div>
      </section>

      <section class="cta">
        <h2>Начните прямо сейчас</h2>
        <p>Авторизуйтесь через Telegram или MAX — это быстро и безопасно.</p>
        <a tuiButton appearance="primary" size="l" routerLink="/auth">
          Начать
        </a>
      </section>
    </div>
  `,
  styles: [`
    .landing {
      max-width: 960px;
      margin: 0 auto;
      padding: 0 1rem;
    }

    .hero {
      text-align: center;
      padding: 4rem 0 3rem;
    }

    .hero-title {
      font-size: 3rem;
      font-weight: 800;
      margin-bottom: 1rem;
    }

    .hero-subtitle {
      font-size: 1.2rem;
      opacity: 0.7;
      max-width: 600px;
      margin: 0 auto 2rem;
      line-height: 1.6;
    }

    .hero-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    .section-title {
      text-align: center;
      font-size: 1.8rem;
      margin: 3rem 0 2rem;
    }

    .feature-grid, .level-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .feature-card, .level-card {
      padding: 2rem;
      border-radius: 1rem;
      border: 1px solid var(--tui-border-normal);
      text-align: center;
    }

    .feature-icon {
      font-size: 2.5rem;
      margin-bottom: 1rem;
    }

    .feature-card h3, .level-card h3 {
      margin: 0.5rem 0;
    }

    .feature-card p, .level-card p {
      opacity: 0.7;
      line-height: 1.5;
    }

    .level-badge {
      font-size: 2rem;
    }

    .cta {
      text-align: center;
      padding: 3rem 0 4rem;
    }

    .cta h2 {
      margin-bottom: 0.5rem;
    }

    .cta p {
      opacity: 0.7;
      margin-bottom: 1.5rem;
    }
  `],
})
export class LandingComponent {}
