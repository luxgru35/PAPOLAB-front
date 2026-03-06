import { useState, useMemo } from 'react';
import { Topbar } from '../components/layout/Topbar';
import { CreateClientModal } from '../components/modals/CreateClientModal';
import { MOCK_CLIENTS } from '../tempData/mockClients';
import type { Client, ClientStatus } from '../types/client';

// ── Helpers ───────────────────────────────────────
const STATUS_CONFIG: Record<ClientStatus, { label: string; badge: string; dot: string }> = {
  active:   { label: 'Актуален',    badge: 'badge-green',  dot: 'var(--success)' },
  contract: { label: 'Договор',     badge: 'badge-yellow', dot: 'var(--warning)' },
  inactive: { label: 'Не актуален', badge: 'badge-red',    dot: 'var(--danger)'  },
  new:      { label: 'Новый',       badge: 'badge-blue',   dot: 'var(--info)'    },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function fullName(c: Client) {
  return [c.lastName, c.firstName, c.patronymic].filter(Boolean).join(' ');
}

// ── Component ─────────────────────────────────────
export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>(MOCK_CLIENTS);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  // Client-side search
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        fullName(c).toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.email?.toLowerCase().includes(q)
    );
  }, [clients, search]);

  // Stats
  const totalActive = clients.filter((c) => c.status === 'active').length;
  const totalCalcs = clients.reduce((sum, c) => sum + c.calculationsCount, 0);
  const totalContracts = clients.filter((c) => c.status === 'contract').length;

  // Add new client from modal (mock — no backend yet)
  const handleClientCreated = () => {
    setModalOpen(false);
    // TODO: replace with real API call + refetch
  };

  return (
    <div className="app-shell">
      <Topbar />

      <main className="page-content">
        {/* ── Header ── */}
        <div className="page-header">
          <div>
            <div className="page-title-text">Клиенты</div>
            <div className="page-subtitle">Всего: {clients.length} клиента</div>
          </div>
          <button className="btn-primary btn-primary--inline" onClick={() => setModalOpen(true)}>
            + Создать клиента
          </button>
        </div>

        {/* ── Summary cards ── */}
        <div className="summary-cards">
          <div className="card">
            <div className="card-title">Все клиенты</div>
            <div className="card-value">{clients.length} <span>чел.</span></div>
          </div>
          <div className="card">
            <div className="card-title">Актуальных расчётов</div>
            <div className="card-value">{totalCalcs} <span>шт.</span></div>
          </div>
          <div className="card">
            <div className="card-title">Заключено договоров</div>
            <div className="card-value">{totalContracts} <span>шт.</span></div>
          </div>
        </div>

        {/* ── Search ── */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <div className="search-box" style={{ flex: 1, margin: 0 }}>
            <span className="search-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
            </span>
            <input
              className="form-input"
              style={{ paddingLeft: 36 }}
              placeholder="Поиск по имени, телефону, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="icon-btn" title="Фильтр">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" />
            </svg>
          </button>
        </div>

        {/* ── Table ── */}
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <div>Клиенты не найдены</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Клиент</th>
                  <th>Телефон</th>
                  <th>Расчётов</th>
                  <th>Статус</th>
                  <th>Дата</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((client) => {
                  const status = STATUS_CONFIG[client.status];
                  return (
                    <tr key={client.id} style={{ cursor: 'pointer' }}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{fullName(client)}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                          {client.email ?? '—'}
                        </div>
                      </td>
                      <td>{client.phone}</td>
                      <td>{client.calculationsCount}</td>
                      <td>
                        <span className={`badge ${status.badge}`}>
                          <span className="status-dot" style={{ background: status.dot }} />
                          {status.label}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {formatDate(client.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* ── Modal ── */}
      <CreateClientModal
        open={modalOpen}
        onClose={handleClientCreated}
      />
    </div>
  );
}
