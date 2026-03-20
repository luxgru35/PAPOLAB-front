import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export function Topbar() {
  const { pathname } = useLocation();
  const logout = useAuthStore((s) => s.logout);
  const displayName = useAuthStore((s) => s.displayName) ?? 'Менеджер';

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'М';

  return (
    <header className="topbar">
      <Link to="/clients" className="logo" style={{ textDecoration: 'none' }}>
        <div className="logo-icon">С</div>
        СтройКалькулятор
      </Link>

      <nav className="topbar-nav">
        <Link
          to="/clients"
          className={`nav-link ${pathname.startsWith('/clients') ? 'active' : ''}`}
        >
          Клиенты
        </Link>
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{displayName}</span>
        <button onClick={logout} className="btn btn-ghost btn-sm" type="button">
          Выйти
        </button>
        <button
          onClick={logout}
          className="avatar"
          title="Выйти"
          style={{ border: 'none', cursor: 'pointer' }}
        >
          {initials}
        </button>
      </div>
    </header>
  );
}
