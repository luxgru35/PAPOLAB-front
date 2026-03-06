import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export function Topbar() {
  const { pathname } = useLocation();
  const logout = useAuthStore((s) => s.logout);

  // Derive initials from token or use placeholder
  const initials = 'ИМ';
  const displayName = 'Иванова М.П.';

  return (
    <header className="topbar">
      <Link to="/dashboard" className="logo" style={{ textDecoration: 'none' }}>
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
        <Link
          to="/calculations"
          className={`nav-link ${pathname.startsWith('/calculations') ? 'active' : ''}`}
        >
          Расчёты
        </Link>
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{displayName}</span>
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
