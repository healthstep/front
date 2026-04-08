import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TuiButton } from '@taiga-ui/core';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, TuiButton],
  template: `
    <div class="landing">

      <!-- Hero -->
      <header class="hero">
        <div class="hero-content">
          <div class="hero-badge">🏥 Бесплатно &amp; без регистрации через бота</div>
          <h1 class="hero-title">ЗдравоШаг</h1>
          <p class="hero-subtitle">
            Храните результаты анализов, следите за нормой, получайте персональные рекомендации — прямо в Telegram или MAX.
          </p>
          <div class="hero-actions">
            <a tuiButton appearance="primary" size="l" routerLink="/auth" class="cta-btn">
              Войти в кабинет
            </a>
            <a tuiButton appearance="secondary" size="l" href="https://t.me/zdravoshag_bot" target="_blank" class="cta-btn">
              📱 Открыть в Telegram
            </a>
          </div>
        </div>
        <div class="hero-visual">
          <div class="health-card">
            <div class="hc-row"><span class="hc-icon ok">✅</span> Гемоглобин <span class="hc-val">142 г/л</span></div>
            <div class="hc-row"><span class="hc-icon warn">⚠️</span> Холестерин <span class="hc-val">5.8 ммоль/л</span></div>
            <div class="hc-row"><span class="hc-icon ok">✅</span> Глюкоза <span class="hc-val">4.5 ммоль/л</span></div>
            <div class="hc-row"><span class="hc-icon empty">—</span> Давление <span class="hc-val add">+ добавить</span></div>
            <div class="hc-progress">
              <div class="hc-bar" style="width: 70%"></div>
            </div>
            <div class="hc-label">Прогресс: 70%</div>
          </div>
        </div>
      </header>

      <!-- How it works -->
      <section class="section">
        <h2 class="section-title">Как это работает</h2>
        <div class="steps">
          <div class="step">
            <div class="step-num">1</div>
            <div class="step-body">
              <h3>Авторизация через бота</h3>
              <p>Откройте Telegram или MAX, нажмите «Старт» — бот запросит ваш номер телефона. Готово.</p>
            </div>
          </div>
          <div class="step">
            <div class="step-num">2</div>
            <div class="step-body">
              <h3>Вносите данные</h3>
              <p>Добавляйте результаты анализов, измерений и визитов к врачу прямо в чате — по группам.</p>
            </div>
          </div>
          <div class="step">
            <div class="step-num">3</div>
            <div class="step-body">
              <h3>Получайте рекомендации</h3>
              <p>Каждый день в 08:00 — персональный совет на основе ваших показателей. Полная картина — в кабинете.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Features grid -->
      <section class="section">
        <h2 class="section-title">Возможности</h2>
        <div class="feature-grid">
          <div class="feature-card">
            <div class="feature-icon">🔔</div>
            <h3>Напоминания</h3>
            <p>Бот напомнит, когда пора обновить анализы или записаться к врачу.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">📊</div>
            <h3>Нормы и отклонения</h3>
            <p>Автоматическая оценка: всё ли в норме или есть поводы для беспокойства.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">💡</div>
            <h3>Еженедельный план</h3>
            <p>Персональный аукцион рекомендаций: питание, активность, профилактика — с учётом ваших данных.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">📈</div>
            <h3>Визуализация</h3>
            <p>Наглядный дашборд: группы показателей, статусы, история.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🔒</div>
            <h3>Приватность</h3>
            <p>Данные хранятся только у вас. Никаких посторонних уведомлений или рекламы.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🤝</div>
            <h3>Поддержка</h3>
            <p>Есть вопрос? Напишите в Telegram или MAX — отвечаем быстро.</p>
          </div>
        </div>
      </section>

      <!-- Levels -->
      <section class="section">
        <h2 class="section-title">Уровни здоровья</h2>
        <p class="section-sub">Заполняйте показатели — получайте новые уровни и открывайте новые критерии.</p>
        <div class="level-grid">
          <div class="level-card green">
            <span class="level-icon">🟢</span>
            <h3>Нормис</h3>
            <p>Базовый набор: кровь, биохимия, давление, активность.</p>
          </div>
          <div class="level-card yellow">
            <span class="level-icon">🟡</span>
            <h3>Сын маминой подруги</h3>
            <p>Расширенный чекап: инструментальные, визиты, гормоны.</p>
          </div>
          <div class="level-card red">
            <span class="level-icon">🔥</span>
            <h3>Гига чад</h3>
            <p>Полный контроль: вакцинация, специализированные показатели.</p>
          </div>
        </div>
      </section>

      <!-- CTA -->
      <section class="cta-section">
        <div class="cta-box">
          <h2>Начните прямо сейчас — это бесплатно</h2>
          <p>Авторизуйтесь через Telegram или MAX за 30 секунд.</p>
          <div class="cta-buttons">
            <a tuiButton appearance="primary" size="l" routerLink="/auth">Войти в кабинет</a>
            <a tuiButton appearance="outline" size="l" href="https://t.me/zdravoshag_bot" target="_blank">📱 Telegram</a>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="footer">
        <div class="footer-grid">
          <div class="footer-col">
            <span class="footer-logo">🏥 ЗдравоШаг</span>
            <p>Персональный помощник по здоровью в мессенджере.</p>
          </div>
          <div class="footer-col">
            <h4>Боты</h4>
            <ul>
              <li><a href="https://t.me/zdravoshag_bot" target="_blank">📱 Telegram-бот</a></li>
              <li><a href="https://max.ru/bot" target="_blank">💬 MAX-бот</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>Поддержка</h4>
            <ul>
              <li><a href="https://t.me/vladimirialymov" target="_blank">✉️ Telegram</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© {{ currentYear }} ЗдравоШаг. Сделано с ❤️ для вашего здоровья.</span>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .landing {
      max-width: 1100px;
      margin: 0 auto;
      padding: 0 1.25rem;
    }

    /* ---- Hero ---- */
    .hero {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 3rem;
      align-items: center;
      padding: 4rem 0 3rem;
    }

    @media (max-width: 720px) {
      .hero { grid-template-columns: 1fr; text-align: center; }
      .hero-actions { justify-content: center; }
    }

    .hero-badge {
      display: inline-block;
      background: #e0f2fe;
      color: #0284c7;
      font-size: 0.8rem;
      font-weight: 600;
      padding: 0.3rem 0.75rem;
      border-radius: 999px;
      margin-bottom: 1rem;
    }

    .hero-title {
      font-size: 3.25rem;
      font-weight: 800;
      margin: 0 0 1rem;
      color: #0f172a;
      line-height: 1.1;
    }

    .hero-subtitle {
      font-size: 1.1rem;
      color: #475569;
      line-height: 1.65;
      margin: 0 0 2rem;
    }

    .hero-actions {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    /* Health card mockup */
    .health-card {
      background: white;
      border-radius: 1.25rem;
      padding: 1.5rem;
      box-shadow: 0 8px 32px rgba(0,0,0,0.1);
      border: 1px solid #e2e8f0;
    }

    .hc-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 0;
      border-bottom: 1px solid #f8fafc;
      font-size: 0.875rem;
      color: #334155;
    }

    .hc-icon { font-size: 1rem; width: 1.5rem; }
    .hc-val { margin-left: auto; font-weight: 600; color: #0f172a; }
    .hc-val.add { color: #0284c7; font-weight: 400; cursor: pointer; }
    .hc-icon.warn { color: #f59e0b; }
    .hc-icon.empty { color: #cbd5e1; }

    .hc-progress {
      height: 8px;
      background: #e2e8f0;
      border-radius: 4px;
      overflow: hidden;
      margin: 1rem 0 0.25rem;
    }

    .hc-bar {
      height: 100%;
      background: linear-gradient(90deg, #0ea5e9, #0284c7);
      border-radius: 4px;
    }

    .hc-label { font-size: 0.75rem; color: #94a3b8; text-align: right; }

    /* ---- Sections ---- */
    .section {
      padding: 3rem 0;
      border-top: 1px solid #f1f5f9;
    }

    .section-title {
      text-align: center;
      font-size: 1.75rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 0.5rem;
    }

    .section-sub {
      text-align: center;
      color: #64748b;
      margin: 0 0 2rem;
    }

    /* Steps */
    .steps {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      max-width: 700px;
      margin: 2rem auto 0;
    }

    .step {
      display: flex;
      gap: 1.25rem;
      align-items: flex-start;
    }

    .step-num {
      width: 2.25rem;
      height: 2.25rem;
      border-radius: 50%;
      background: #0284c7;
      color: white;
      font-weight: 700;
      font-size: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .step-body h3 { margin: 0 0 0.25rem; font-size: 1rem; color: #0f172a; }
    .step-body p  { margin: 0; color: #64748b; font-size: 0.9rem; line-height: 1.5; }

    /* Feature grid */
    .feature-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.25rem;
      margin-top: 2rem;
    }

    .feature-card {
      padding: 1.5rem;
      border-radius: 1rem;
      border: 1px solid #e2e8f0;
      background: white;
      text-align: center;
      transition: box-shadow 0.2s;
    }

    .feature-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); }

    .feature-icon { font-size: 2rem; margin-bottom: 0.75rem; }
    .feature-card h3 { margin: 0 0 0.5rem; font-size: 1rem; color: #0f172a; }
    .feature-card p  { margin: 0; color: #64748b; font-size: 0.875rem; line-height: 1.5; }

    /* Level grid */
    .level-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.25rem;
      margin-top: 1.5rem;
    }

    .level-card {
      padding: 1.5rem;
      border-radius: 1rem;
      text-align: center;
      border: 2px solid transparent;
    }

    .level-card.green { background: #f0fdf4; border-color: #bbf7d0; }
    .level-card.yellow { background: #fffbeb; border-color: #fde68a; }
    .level-card.red { background: #fff7ed; border-color: #fed7aa; }

    .level-icon { font-size: 2rem; display: block; margin-bottom: 0.75rem; }
    .level-card h3 { margin: 0 0 0.5rem; font-size: 1rem; color: #0f172a; }
    .level-card p  { margin: 0; color: #64748b; font-size: 0.875rem; line-height: 1.5; }

    /* CTA Section */
    .cta-section {
      padding: 3rem 0;
    }

    .cta-box {
      background: linear-gradient(135deg, #0ea5e9, #0284c7);
      border-radius: 1.5rem;
      padding: 3rem 2rem;
      text-align: center;
      color: white;
    }

    .cta-box h2 { margin: 0 0 0.5rem; font-size: 1.75rem; }
    .cta-box p  { margin: 0 0 2rem; opacity: 0.85; font-size: 1rem; }

    .cta-buttons {
      display: flex;
      gap: 0.75rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    /* Footer */
    .footer {
      border-top: 1px solid #e2e8f0;
      padding: 2.5rem 0 1.5rem;
      margin-top: 1rem;
    }

    .footer-grid {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr;
      gap: 2rem;
      margin-bottom: 2rem;
    }

    @media (max-width: 600px) {
      .footer-grid { grid-template-columns: 1fr; }
    }

    .footer-logo {
      font-size: 1.1rem;
      font-weight: 700;
      color: #0f172a;
      display: block;
      margin-bottom: 0.5rem;
    }

    .footer-col p {
      color: #64748b;
      font-size: 0.875rem;
      margin: 0;
      line-height: 1.5;
    }

    .footer-col h4 {
      font-size: 0.875rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .footer-col ul {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .footer-col a {
      color: #0284c7;
      text-decoration: none;
      font-size: 0.875rem;
    }

    .footer-col a:hover { text-decoration: underline; }

    .footer-bottom {
      border-top: 1px solid #f1f5f9;
      padding-top: 1.25rem;
      text-align: center;
      color: #94a3b8;
      font-size: 0.8rem;
    }
  `],
})
export class LandingComponent {
  currentYear = new Date().getFullYear();
}
