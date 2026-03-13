import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Topbar } from '../components/layout/Topbar';
import { clientsApi } from '../api/clients';
import { clientFullName, clientInitials } from '../types/client';
import { formatMinor, STATUS_LABELS, CALC_TYPE_LABELS } from '../types/order';
import type { ClientCard } from '../types/client';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

const STATUS_BADGE: Record<string, string> = {
  accepted: 'badge-green',
  in_progress: 'badge-yellow',
  delivered: 'badge-blue',
};
const STATUS_DOT: Record<string, string> = {
  accepted: 'var(--success)',
  in_progress: 'var(--warning)',
  delivered: 'var(--info)',
};

export default function ClientCardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [card, setCard] = useState<ClientCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState<'card' | 'orders'>('card');

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await clientsApi.getCard(id);
        setCard(data);
      } catch {
        setError('Не удалось загрузить карточку клиента');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="app-shell">
        <Topbar />
        <div className="empty-state" style={{ marginTop: 60 }}>
          <div className="empty-icon">⏳</div>
          <div>Загрузка...</div>
        </div>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="app-shell">
        <Topbar />
        <div className="empty-state" style={{ marginTop: 60 }}>
          <div className="empty-icon">⚠️</div>
          <div>{error ?? 'Клиент не найден'}</div>
          <button className="btn btn-ghost" style={{ marginTop: 16 }} onClick={() => navigate('/clients')}>
            ← Назад
          </button>
        </div>
      </div>
    );
  }

  const { client, orders } = card;
  const initials = clientInitials(client);
  const fullName = clientFullName(client);

  return (
    <div className="app-shell">
      <Topbar />
      <div className="layout-with-sidebar" style={{ flex: 1, minHeight: 'calc(100vh - 56px)' }}>
        {/* ── Sidebar ── */}
        <div className="sidebar">
          <div className="sidebar-section">Навигация</div>
          <div
            className={`sidebar-item ${sidebarTab === 'card' ? 'active' : ''}`}
            onClick={() => setSidebarTab('card')}
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="8" cy="5" r="3" /><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" />
            </svg>
            Карточка
          </div>
          <div
            className={`sidebar-item ${sidebarTab === 'orders' ? 'active' : ''}`}
            onClick={() => setSidebarTab('orders')}
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="3" width="12" height="10" rx="1" /><path d="M5 7h6M5 10h4" />
            </svg>
            Расчёты
            {orders.length > 0 && (
              <span className="badge badge-blue" style={{ fontSize: 10, marginLeft: 'auto' }}>
                {orders.length}
              </span>
            )}
          </div>

          <div className="sidebar-section" style={{ marginTop: 16 }}>Статус</div>
          <div style={{ padding: '8px 12px' }}>
            {orders.length > 0 ? (
              <span className={`badge ${STATUS_BADGE[orders[0].status] ?? 'badge-blue'}`} style={{ fontSize: 11 }}>
                <span className="status-dot" style={{ background: STATUS_DOT[orders[0].status] ?? 'var(--info)' }} />
                {STATUS_LABELS[orders[0].status]}
              </span>
            ) : (
              <span className="badge badge-blue" style={{ fontSize: 11 }}>
                <span className="status-dot" style={{ background: 'var(--info)' }} />
                Новый
              </span>
            )}
          </div>
        </div>

        {/* ── Content ── */}
        <div className="content">
          <div className="breadcrumb">
            <Link to="/clients">Клиенты</Link>
            <span className="breadcrumb-sep">›</span>
            <span>{fullName}</span>
          </div>

          {sidebarTab === 'card' ? (
            <>
              {/* Client header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%',
                    background: 'linear-gradient(135deg,var(--accent),var(--accent-2))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-display)', fontSize: 22, color: '#0E1117',
                  }}>
                    {initials}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, letterSpacing: '.03em' }}>
                      {fullName}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {client.phone} {client.email && <> &nbsp;·&nbsp; {client.email}</>}
                    </div>
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm">✎ Редактировать</button>
              </div>

              <div className="client-info-block">
                <div className="cib-item">
                  <div className="cib-label">Телефон</div>
                  <div className="cib-val">{client.phone || '—'}</div>
                </div>
                <div className="cib-item">
                  <div className="cib-label">E-mail</div>
                  <div className="cib-val">{client.email || '—'}</div>
                </div>
                <div className="cib-item">
                  <div className="cib-label">Добавлен</div>
                  <div className="cib-val">{formatDate(client.created_at)}</div>
                </div>
              </div>

              {/* Orders section */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Расчёты клиента</div>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => navigate(`/clients/${id}/new-order`)}
                >
                  + Создать расчёт
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="empty-state" style={{ padding: '30px 20px' }}>
                  <div className="empty-icon">📋</div>
                  <div>Расчётов пока нет</div>
                </div>
              ) : (
                orders.map((order, idx) => {
                  const typeInfo = CALC_TYPE_LABELS[order.calc_type];
                  return (
                    <div className="result-section" key={order.id}>
                      <div className="result-section-header">
                        <div className="result-section-title">
                          {typeInfo.icon} Расчёт №{idx + 1}
                          <span className={`badge ${STATUS_BADGE[order.status] ?? 'badge-blue'}`} style={{ fontSize: 10 }}>
                            {STATUS_LABELS[order.status]}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => navigate(`/orders/${order.id}`)}
                          >
                            Открыть
                          </button>
                        </div>
                      </div>
                      <div className="result-section-body" style={{ padding: '12px 18px' }}>
                        <div style={{ display: 'flex', gap: 20, fontSize: 12, color: 'var(--text-muted)' }}>
                          <span>{typeInfo.icon} {typeInfo.label}</span>
                          <span>📅 {formatDate(order.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          ) : (
            /* Orders tab */
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, letterSpacing: '.03em' }}>
                  Расчёты
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => navigate(`/clients/${id}/new-order`)}
                >
                  + Создать расчёт
                </button>
              </div>
              {orders.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📋</div>
                  <div>Расчётов пока нет</div>
                </div>
              ) : (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Тип</th>
                        <th>Статус</th>
                        <th>Дата</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order, idx) => {
                        const typeInfo = CALC_TYPE_LABELS[order.calc_type];
                        return (
                          <tr key={order.id}>
                            <td>
                              <div style={{ fontWeight: 500 }}>{typeInfo.icon} {typeInfo.label}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Расчёт №{idx + 1}</div>
                            </td>
                            <td>
                              <span className={`badge ${STATUS_BADGE[order.status] ?? 'badge-blue'}`}>
                                <span className="status-dot" style={{ background: STATUS_DOT[order.status] ?? 'var(--info)' }} />
                                {STATUS_LABELS[order.status]}
                              </span>
                            </td>
                            <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                              {formatDate(order.created_at)}
                            </td>
                            <td>
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => navigate(`/orders/${order.id}`)}
                              >
                                Открыть
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
