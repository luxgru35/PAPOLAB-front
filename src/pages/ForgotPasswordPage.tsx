import { Link } from 'react-router-dom';

export default function ForgotPasswordPage() {
  return (
    <div className="auth-root">
      <div className="auth-card">

        {/* ── Left: content ── */}
        <div className="panel-left">
          <a className="logo" href="/">
            <div className="logo-icon">С</div>
            СтройКалькулятор
          </a>

          <div className="forgot-icon" aria-hidden="true">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>

          <h1 className="auth-title">Сброс пароля</h1>
          <p className="auth-subtitle" style={{ marginBottom: 0 }}>
            Самостоятельный сброс пароля недоступен.
          </p>

          <div className="forgot-card">
            <div className="forgot-card__icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .99h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
              </svg>
            </div>
            <div className="forgot-card__text">
              <div className="forgot-card__title">Обратитесь к администратору</div>
              <div className="forgot-card__desc">
                Администратор системы сбросит пароль и пришлёт новые данные для входа
              </div>
            </div>
          </div>

          <Link to="/login" className="btn-primary" style={{ textDecoration: 'none', marginTop: 8 }}>
            ← Вернуться к входу
          </Link>
        </div>

        {/* ── Right: illustration ── */}
        <div className="panel-right" aria-hidden="true">
          <div className="grid-bg" />
          <div className="float-card float-card--tl">
            <div className="float-card__label">Фундамент</div>
            <div className="float-card__value">284 500 ₽</div>
            <div className="float-card__status float-card__status--success">↑ Актуален</div>
          </div>
          <div className="float-card float-card--tr">
            <div className="float-card__label">Каркас</div>
            <div className="float-card__value">1 340 000 ₽</div>
          </div>
          <div className="float-card float-card--ml">
            <div className="float-card__label">Кровля</div>
            <div className="float-card__value">512 000 ₽</div>
            <div className="float-card__status float-card__status--warning">→ Пересчитать</div>
          </div>
          <div className="big-text big-text--dim">СТРОИМ</div>
          <div className="big-text big-text--accent">ТОЧНЕЕ</div>
          <p className="panel-footer">ООО «Строительная компания» · Ульяновская область</p>
        </div>

      </div>
    </div>
  );
}
