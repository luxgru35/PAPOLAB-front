import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { Input, PasswordInput } from '../components/ui/Input';
import { useAuthStore } from '../store/authStore';
import type { LoginRequest } from '../types/auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, isAuthenticated, error, clearError } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>({ mode: 'onSubmit' });

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data: LoginRequest) => {
    clearError();
    await login(data);
  };

  return (
    <div className="auth-root auth-root--login">
      <div className="auth-card">

        {/* ── Left: form ── */}
        <div className="panel-left">
          <a className="logo" href="/">
            <div className="logo-icon">С</div>
            СтройКалькулятор
          </a>

          <h1 className="auth-title">Добро пожаловать</h1>
          <p className="auth-subtitle">Войдите в систему, чтобы продолжить</p>

          {error && (
            <div className="toast toast--visible" role="alert">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM7 5h2v5H7V5zm0 6h2v2H7v-2z" fill="currentColor" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Input
              label="Email"
              type="email"
              placeholder="example@company.ru"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email', {
                required: 'Введите email',
                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Некорректный email' },
              })}
            />

            <PasswordInput
              label="Пароль"
              placeholder="Введите пароль"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register('password', { required: 'Введите пароль' })}
            />

            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading}
            >
              {isLoading ? <span className="spinner" aria-hidden="true" /> : 'Войти'}
            </button>
          </form>

          <div className="auth-links">
            <Link to="/forgot-password" className="auth-link">
              Забыли пароль?
            </Link>
            <span className="auth-links__sep">·</span>
            <Link to="/register" className="auth-link">
              Регистрация
            </Link>
          </div>
        </div>

        {/* ── Right: illustration ── */}
        <div className="panel-right" aria-hidden="true">
          <div className="panel-right__photo panel-right__photo--login" />
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
