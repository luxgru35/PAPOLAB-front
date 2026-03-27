import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export function Topbar() {
  const logout = useAuthStore((s) => s.logout);
  const displayName = useAuthStore((s) => s.displayName) ?? 'Менеджер';
  const email = useAuthStore((s) => s.email) ?? '';
  const [profileOpen, setProfileOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'М';

  useEffect(() => {
    if (!profileOpen) return;
    const handler = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [profileOpen]);

  useEffect(() => {
    if (!profileOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setProfileOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [profileOpen]);

  return (
    <>
      <header className="topbar">
        <Link to="/clients" className="logo" style={{ textDecoration: 'none' }}>
          <div className="logo-icon">С</div>
          СтройКалькулятор
        </Link>


        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{displayName}</span>
          <button
            onClick={() => setProfileOpen(true)}
            className="avatar"
            title="Профиль"
            type="button"
            style={{ border: 'none', cursor: 'pointer' }}
          >
            {initials}
          </button>
        </div>
      </header>

      {/* ── Профиль модалка ── */}
      {profileOpen && (
        <div className="modal-dim" role="dialog" aria-modal="true">
          <div className="modal-box profile-modal" ref={modalRef}>

            {/* Шапка */}
            <div className="modal-header">
              <div className="modal-title">Профиль</div>
              <button className="modal-close" onClick={() => setProfileOpen(false)} type="button">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M1 1l12 12M13 1L1 13" />
                </svg>
              </button>
            </div>

            {/* Аватар + имя */}
            <div className="profile-modal__hero">
              <div className="profile-modal__avatar">{initials}</div>
              <div>
                <div className="profile-modal__name">{displayName}</div>
                {email && <div className="profile-modal__email">{email}</div>}
              </div>
            </div>

            {/* Информация */}
            <div className="profile-modal__info">
              <div className="profile-modal__row">
                <span className="profile-modal__label">Роль</span>
                <span className="profile-modal__value">Менеджер</span>
              </div>
              <div className="profile-modal__row">
                <span className="profile-modal__label">Организация</span>
                <span className="profile-modal__value">ООО «Чинилы»</span>
              </div>
              <div className="profile-modal__row">
                <span className="profile-modal__label">Статус</span>
                <span className="profile-modal__value profile-modal__value--active">
                  <span className="profile-modal__dot" /> Активен
                </span>
              </div>
            </div>

            {/* Кнопка выхода */}
            <button
              className="btn profile-modal__logout"
              onClick={() => { setProfileOpen(false); logout(); }}
              type="button"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Выйти из аккаунта
            </button>

          </div>
        </div>
      )}
    </>
  );
}