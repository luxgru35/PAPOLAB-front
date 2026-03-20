import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Topbar } from '../components/layout/Topbar';
import { CreateClientModal } from '../components/modals/CreateClientModal';
import { clientsApi } from '../api/clients';
import { clientFullName } from '../types/client';
import type { Client } from '../types/client';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export default function ClientsPage() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState({ accepted: 0, delivered: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await clientsApi.list();
      setClients(data);
    } catch {
      setError('Не удалось загрузить клиентов');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    (async () => {
      if (clients.length === 0) {
        setStats({ accepted: 0, delivered: 0 });
        return;
      }
      const cards = await Promise.allSettled(clients.map((c) => clientsApi.getCard(c.id)));
      let accepted = 0;
      let delivered = 0;

      cards.forEach((card) => {
        if (card.status !== 'fulfilled') return;
        card.value.orders.forEach((order) => {
          if (order.status === 'accepted') accepted += 1;
          if (order.status === 'delivered') delivered += 1;
        });
      });

      setStats({ accepted, delivered });
    })();
  }, [clients]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        clientFullName(c).toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.email?.toLowerCase().includes(q)
    );
  }, [clients, search]);

  const handleClientCreated = () => {
    setModalOpen(false);
    load();
  };

  return (
    <div className="app-shell">
      <Topbar />
      <main className="page-content">
        {/* Header */}
        <div className="page-header">
          <div>
            <div className="page-title-text">Клиенты</div>
            <div className="page-subtitle">
              {loading ? 'Загрузка...' : `Всего: ${clients.length}`}
            </div>
          </div>
          <button className="btn btn-primary btn-primary--inline" onClick={() => setModalOpen(true)}>
            + Создать клиента
          </button>
        </div>

        {/* Summary */}
        <div className="summary-cards">
          <div className="card">
            <div className="card-title">Все клиенты</div>
            <div className="card-value">{clients.length} <span>чел.</span></div>
          </div>
          <div className="card">
            <div className="card-title">Актуальных расчётов</div>
            <div className="card-value">{stats.accepted} <span>шт.</span></div>
          </div>
          <div className="card">
            <div className="card-title">Заключено договоров</div>
            <div className="card-value">{stats.delivered} <span>шт.</span></div>
          </div>
        </div>

        {/* Search */}
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
        </div>

        {/* State: loading / error / empty / table */}
        {loading ? (
          <div className="empty-state">
            <div className="empty-icon">⏳</div>
            <div>Загрузка клиентов...</div>
          </div>
        ) : error ? (
          <div className="empty-state">
            <div className="empty-icon">⚠️</div>
            <div style={{ marginBottom: 12 }}>{error}</div>
            <button className="btn btn-ghost" onClick={load}>Повторить</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">{search ? '🔍' : '👤'}</div>
            <div>{search ? 'Клиенты не найдены' : 'Клиентов пока нет'}</div>
            {!search && (
              <button
                className="btn btn-primary btn-primary--inline"
                style={{ marginTop: 16 }}
                onClick={() => setModalOpen(true)}
              >
                + Создать первого клиента
              </button>
            )}
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Клиент</th>
                  <th>Телефон</th>
                  <th>Дата добавления</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((client) => (
                  <tr
                    key={client.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/clients/${client.id}`)}
                  >
                    <td>
                      <div style={{ fontWeight: 500 }}>{clientFullName(client)}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                        {client.email || '—'}
                      </div>
                    </td>
                    <td>{client.phone || '—'}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {formatDate(client.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <CreateClientModal open={modalOpen} onClose={handleClientCreated} />
    </div>
  );
}
