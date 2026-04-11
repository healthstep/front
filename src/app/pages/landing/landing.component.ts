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
          <div class="hero-badge">🇷🇺 90% показателей доступны бесплатно</div>
          <h1 class="hero-title">ЗдравоШаг</h1>
          <p class="hero-subtitle">
            Храните результаты анализов, отслеживайте нормы и получайте
            персональные рекомендации — без очередей и лишних трат.
          </p>
          <div class="hero-actions">
            <a tuiButton appearance="primary" size="l" routerLink="/auth" class="cta-btn">
              Войти / Зарегистрироваться
            </a>
          </div>
          <p class="hero-note">Бесплатно · Занимает 2 минуты</p>
        </div>
        <div class="hero-visual">
          <div class="health-card">
            <div class="hc-header">
              <span class="hc-title">Мои показатели</span>
              <span class="hc-badge ok">70% заполнено</span>
            </div>
            <div class="hc-row"><span class="hc-dot ok"></span> Гемоглобин <span class="hc-val">142 г/л</span></div>
            <div class="hc-row"><span class="hc-dot warn"></span> Холестерин <span class="hc-val warn">5.8 ммоль/л</span></div>
            <div class="hc-row"><span class="hc-dot ok"></span> Глюкоза <span class="hc-val">4.5 ммоль/л</span></div>
            <div class="hc-row"><span class="hc-dot empty"></span> Давление <span class="hc-val add">+ добавить</span></div>
            <div class="hc-row"><span class="hc-dot ok"></span> ИМТ <span class="hc-val">22.4</span></div>
            <div class="hc-progress">
              <div class="hc-bar" style="width: 70%"></div>
            </div>
          </div>
        </div>
      </header>

      <!-- Stats / Trust bar -->
      <section class="stats-bar">
        <div class="stat">
          <span class="stat-num">90%</span>
          <span class="stat-label">показателей бесплатны в России</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat">
          <span class="stat-num">75</span>
          <span class="stat-label">критериев здоровья в базе</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat">
          <span class="stat-num">2 мин</span>
          <span class="stat-label">на старт — без лишних шагов</span>
        </div>
      </section>

      <!-- Reality check -->
      <section class="section reality">
        <div class="reality-content">
          <div class="reality-text">
            <h2 class="section-title left">Большинство узнаёт о проблеме, когда боль уже не игнорировать</h2>
            <div class="reality-points">
              <div class="rp">
                <span class="rp-num">75%</span>
                <span class="rp-desc">людей не проверяют здоровье, пока что-то не начинает болеть</span>
              </div>
              <div class="rp">
                <span class="rp-num">10 лет</span>
                <span class="rp-desc">в среднем проходит с появления отклонения до постановки диагноза</span>
              </div>
              <div class="rp">
                <span class="rp-num">40%</span>
                <span class="rp-desc">хронических заболеваний можно было предупредить при раннем выявлении</span>
              </div>
            </div>
            <p class="reality-call">
              ЗдравоШаг не заменяет врача — он помогает <strong>замечать отклонения до того, как они станут проблемой</strong>.
              Просто вносите данные из анализов раз в несколько месяцев.
            </p>
          </div>
        </div>
      </section>

      <!-- How it works -->
      <section class="section">
        <h2 class="section-title">Как это работает</h2>
        <p class="section-sub">Просто. Без клиник и страховок.</p>
        <div class="steps">
          <div class="step">
            <div class="step-num">1</div>
            <div class="step-body">
              <h3>Зарегистрируйтесь через мессенджер</h3>
              <p>Авторизация занимает 30 секунд — достаточно поделиться номером телефона через Telegram или MAX.</p>
            </div>
          </div>
          <div class="step">
            <div class="step-num">2</div>
            <div class="step-body">
              <h3>Внесите результаты анализов</h3>
              <p>
                В России большинство анализов крови, мочи и базовые обследования входят в полис ОМС.
                Просто сфотографируйте бланк и перенесите значения.
              </p>
            </div>
          </div>
          <div class="step">
            <div class="step-num">3</div>
            <div class="step-body">
              <h3>Получайте сигналы, пока не поздно</h3>
              <p>
                Система автоматически сравнивает ваши показатели с нормой и подсвечивает отклонения.
                Ежедневный совет в мессенджере — чтобы ничего не забыть.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Free indicators -->
      <section class="section free-section">
        <div class="free-card">
          <div class="free-icon">🏥</div>
          <div class="free-text">
            <h2>Большинство анализов в России бесплатны</h2>
            <p>
              ОМС (обязательное медицинское страхование) покрывает клинический анализ крови,
              биохимию, общий анализ мочи, ЭКГ, флюорографию и многое другое.
              Около <strong>90% показателей</strong> на этой платформе можно получить без доплат
              по направлению от участкового врача.
            </p>
            <a tuiButton appearance="primary" size="m" routerLink="/auth">
              Начать вести показатели
            </a>
          </div>
        </div>
      </section>

      <!-- Features grid -->
      <section class="section">
        <h2 class="section-title">Возможности</h2>
        <div class="feature-grid">
          <div class="feature-card">
            <div class="feature-icon">📊</div>
            <h3>Нормы и отклонения</h3>
            <p>Автоматическая проверка: в норме или есть повод обратиться к врачу.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🔔</div>
            <h3>Напоминания</h3>
            <p>Уведомление, когда анализы устарели или пора обновить показатель.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">💡</div>
            <h3>Персональные советы</h3>
            <p>Рекомендация дня на основе ваших реальных данных — питание, активность, профилактика.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">📈</div>
            <h3>Дашборд здоровья</h3>
            <p>Все показатели в одном месте: статусы, история, прогресс заполнения.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🔒</div>
            <h3>Приватность</h3>
            <p>Данные принадлежат только вам. Никаких посторонних рассылок.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">📋</div>
            <h3>Группы показателей</h3>
            <p>Кровь, биохимия, давление, гормоны, визиты — всё структурировано по категориям.</p>
          </div>
        </div>
      </section>

      <!-- CTA -->
      <section class="cta-section">
        <div class="cta-box">
          <h2>Начните следить за здоровьем сегодня</h2>
          <p>Бесплатно. Занимает 2 минуты. Никаких лишних шагов.</p>
          <a tuiButton appearance="primary" size="l" routerLink="/auth">
            Войти / Зарегистрироваться
          </a>
        </div>
      </section>

      <!-- Footer -->
      <footer class="footer">
        <div class="footer-grid">
          <div class="footer-col">
            <span class="footer-logo">❤️ ЗдравоШаг</span>
            <p>Персональный трекер здоровья.</p>
          </div>
          <div class="footer-col">
            <h4>Навигация</h4>
            <ul>
              <li><a routerLink="/auth">Войти</a></li>
              <li><a routerLink="/dashboard">Дашборд</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>Поддержка</h4>
            <ul>
              <li><a href="https://t.me/vladimirialymov" target="_blank">✉️ Написать</a></li>
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
    :host {
      --brand: #2563eb;
      --brand-dark: #1d4ed8;
      --brand-light: #eff6ff;
      --accent: #059669;
      --warn: #d97706;
      --danger: #dc2626;
      --text: #0f172a;
      --text-muted: #64748b;
      --border: #e2e8f0;
      --surface: #ffffff;
      --radius: 1rem;
    }

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
      padding: 4.5rem 0 3rem;
    }

    @media (max-width: 720px) {
      .hero { grid-template-columns: 1fr; text-align: center; }
      .hero-actions { justify-content: center; }
    }

    .hero-badge {
      display: inline-block;
      background: var(--brand-light);
      color: var(--brand);
      font-size: 0.8rem;
      font-weight: 600;
      padding: 0.3rem 0.75rem;
      border-radius: 999px;
      margin-bottom: 1.25rem;
    }

    .hero-title {
      font-size: 3.5rem;
      font-weight: 800;
      margin: 0 0 1rem;
      color: var(--text);
      line-height: 1.08;
      letter-spacing: -0.02em;
    }

    .hero-subtitle {
      font-size: 1.1rem;
      color: var(--text-muted);
      line-height: 1.7;
      margin: 0 0 2rem;
      max-width: 480px;
    }

    .hero-actions {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
      margin-bottom: 0.75rem;
    }

    .hero-note {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin: 0;
    }

    /* Health card */
    .health-card {
      background: var(--surface);
      border-radius: 1.25rem;
      padding: 1.5rem;
      box-shadow: 0 12px 40px rgba(37,99,235,0.10);
      border: 1px solid var(--border);
    }

    .hc-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
    }

    .hc-title { font-weight: 700; font-size: 0.9rem; color: var(--text); }

    .hc-badge {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.2rem 0.6rem;
      border-radius: 999px;
    }

    .hc-badge.ok { background: #dcfce7; color: #15803d; }

    .hc-row {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.55rem 0;
      border-bottom: 1px solid #f8fafc;
      font-size: 0.875rem;
      color: #334155;
    }

    .hc-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .hc-dot.ok { background: var(--accent); }
    .hc-dot.warn { background: var(--warn); }
    .hc-dot.empty { background: #cbd5e1; }

    .hc-val { margin-left: auto; font-weight: 600; color: var(--text); }
    .hc-val.warn { color: var(--warn); }
    .hc-val.add { color: var(--brand); font-weight: 400; cursor: pointer; }

    .hc-progress {
      height: 6px;
      background: #e2e8f0;
      border-radius: 3px;
      overflow: hidden;
      margin-top: 1rem;
    }

    .hc-bar {
      height: 100%;
      background: linear-gradient(90deg, var(--brand), var(--brand-dark));
      border-radius: 3px;
    }

    /* ---- Stats bar ---- */
    .stats-bar {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 0;
      background: var(--brand);
      border-radius: var(--radius);
      padding: 2rem 1rem;
      margin: 1rem 0 0;
      flex-wrap: wrap;
    }

    .stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0 2.5rem;
      text-align: center;
    }

    .stat-num {
      font-size: 2.25rem;
      font-weight: 800;
      color: white;
      line-height: 1;
    }

    .stat-label {
      font-size: 0.8rem;
      color: rgba(255,255,255,0.75);
      margin-top: 0.4rem;
      max-width: 130px;
      text-align: center;
    }

    .stat-divider {
      width: 1px;
      height: 40px;
      background: rgba(255,255,255,0.2);
    }

    @media (max-width: 600px) {
      .stats-bar { flex-direction: column; gap: 1.5rem; }
      .stat-divider { width: 60px; height: 1px; }
    }

    /* ---- Sections ---- */
    .section {
      padding: 4rem 0;
      border-top: 1px solid #f1f5f9;
    }

    .section-title {
      text-align: center;
      font-size: 1.875rem;
      font-weight: 700;
      color: var(--text);
      margin: 0 0 0.5rem;
      letter-spacing: -0.01em;
    }

    .section-title.left { text-align: left; }

    .section-sub {
      text-align: center;
      color: var(--text-muted);
      margin: 0 0 2.5rem;
      font-size: 1rem;
    }

    /* Reality section */
    .reality {
      background: linear-gradient(135deg, #f8fafc 0%, var(--brand-light) 100%);
      border-radius: 1.5rem;
      margin: 2rem 0;
      border: none;
      padding: 3rem 2.5rem;
    }

    .reality-points {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      margin: 1.5rem 0;
    }

    .rp {
      display: flex;
      align-items: baseline;
      gap: 1rem;
    }

    .rp-num {
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--brand);
      min-width: 80px;
      flex-shrink: 0;
    }

    .rp-desc {
      font-size: 0.95rem;
      color: var(--text-muted);
      line-height: 1.5;
    }

    .reality-call {
      font-size: 0.95rem;
      color: var(--text);
      line-height: 1.65;
      margin: 0;
      padding: 1.25rem;
      background: white;
      border-radius: 0.75rem;
      border-left: 4px solid var(--brand);
    }

    /* Steps */
    .steps {
      display: flex;
      flex-direction: column;
      gap: 1.75rem;
      max-width: 680px;
      margin: 2rem auto 0;
    }

    .step {
      display: flex;
      gap: 1.25rem;
      align-items: flex-start;
    }

    .step-num {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 50%;
      background: var(--brand);
      color: white;
      font-weight: 700;
      font-size: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(37,99,235,0.3);
    }

    .step-body h3 { margin: 0.2rem 0 0.3rem; font-size: 1rem; color: var(--text); font-weight: 600; }
    .step-body p  { margin: 0; color: var(--text-muted); font-size: 0.9rem; line-height: 1.6; }

    /* Free section */
    .free-section { border: none; }

    .free-card {
      display: flex;
      gap: 2rem;
      align-items: flex-start;
      background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
      border-radius: 1.5rem;
      padding: 2.5rem;
      border: 1px solid #a7f3d0;
    }

    @media (max-width: 600px) {
      .free-card { flex-direction: column; }
    }

    .free-icon { font-size: 3rem; flex-shrink: 0; }

    .free-text h2 {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text);
      margin: 0 0 0.75rem;
    }

    .free-text p {
      font-size: 0.95rem;
      color: #374151;
      line-height: 1.65;
      margin: 0 0 1.5rem;
    }

    /* Feature grid */
    .feature-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.25rem;
      margin-top: 2.5rem;
    }

    .feature-card {
      padding: 1.5rem;
      border-radius: var(--radius);
      border: 1px solid var(--border);
      background: var(--surface);
      transition: box-shadow 0.2s, border-color 0.2s;
    }

    .feature-card:hover {
      box-shadow: 0 4px 20px rgba(37,99,235,0.10);
      border-color: #bfdbfe;
    }

    .feature-icon { font-size: 2rem; margin-bottom: 0.75rem; }
    .feature-card h3 { margin: 0 0 0.5rem; font-size: 1rem; color: var(--text); font-weight: 600; }
    .feature-card p  { margin: 0; color: var(--text-muted); font-size: 0.875rem; line-height: 1.6; }

    /* CTA Section */
    .cta-section {
      padding: 3rem 0;
    }

    .cta-box {
      background: linear-gradient(135deg, var(--brand) 0%, #1e40af 100%);
      border-radius: 1.5rem;
      padding: 3.5rem 2rem;
      text-align: center;
      color: white;
      box-shadow: 0 16px 48px rgba(37,99,235,0.3);
    }

    .cta-box h2 { margin: 0 0 0.5rem; font-size: 2rem; font-weight: 700; letter-spacing: -0.01em; }
    .cta-box p  { margin: 0 0 2rem; opacity: 0.8; font-size: 1rem; }

    /* Footer */
    .footer {
      border-top: 1px solid var(--border);
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
      color: var(--text);
      display: block;
      margin-bottom: 0.5rem;
    }

    .footer-col p {
      color: var(--text-muted);
      font-size: 0.875rem;
      margin: 0;
      line-height: 1.5;
    }

    .footer-col h4 {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text);
      margin: 0 0 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
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
      color: var(--brand);
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
