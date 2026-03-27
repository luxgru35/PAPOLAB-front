import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Topbar } from '../components/layout/Topbar';
import { clientsApi } from '../api/clients';
import { clientFullName, clientInitials } from '../types/client';
import { STATUS_LABELS, CALC_TYPE_LABELS } from '../types/order';
import type { ClientCard } from '../types/client';
import { Footer } from '../components/layout/Footer';

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
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    last_name: '',
    first_name: '',
    middle_name: '',
    phone: '',
    email: '',
  });

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await clientsApi.getCard(id);
        setCard(data);
        setEditForm({
          last_name: data.client.last_name ?? '',
          first_name: data.client.first_name ?? '',
          middle_name: data.client.middle_name ?? '',
          phone: data.client.phone ?? '',
          email: data.client.email ?? '',
        });
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
        <Footer />
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="app-shell">
        <Topbar />
        <div className="empty-state" style={{ marginTop: 60 }}>
          <div className="empty-icon">⚠️</div>
          <div style={{ marginBottom: 12 }}>{error ?? 'Клиент не найден'}</div>
          <button className="btn btn-ghost" onClick={() => navigate('/clients')}>
            ← Назад
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const { client, orders } = card;
  const initials = clientInitials(client);
  const fullName = clientFullName(client);

  // Сортируем заказы по дате создания (от старых к новым)
  const sortedOrders = [...orders].sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const saveClient = async () => {
    if (!id) return;
    try {
      setSaving(true);
      const updated = await clientsApi.update(id, {
        last_name: editForm.last_name.trim(),
        first_name: editForm.first_name.trim(),
        middle_name: editForm.middle_name.trim(),
        phone: editForm.phone.trim(),
        email: editForm.email.trim(),
      });
      setCard((prev) => (prev ? { ...prev, client: updated } : prev));
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="app-shell">
      <Topbar />
      <div className="layout-with-sidebar" style={{ flex: 1, minHeight: 'calc(100vh - 56px)' }}>
        {/* ── Sidebar ── */}
        <div className="sidebar">
          {/* Кнопка возврата */}
          <button 
            className="sidebar-item sidebar-item--back" 
            onClick={() => navigate('/clients')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Вернуться к клиентам
          </button>

          {/* Секция статусов */}
          <div className="sidebar-section">Статусы заказов</div>
          
          <div className="sidebar-orders-list">
            {sortedOrders.length === 0 ? (
              <div className="sidebar-empty">
                <span style={{ fontSize: 18, opacity: 0.4 }}>📋</span>
                <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Нет заказов</span>
              </div>
            ) : (
              sortedOrders.map((order, idx) => {
                const typeInfo = CALC_TYPE_LABELS[order.calc_type];
                return (
                  <div
                    key={order.id}
                    className="sidebar-order-item sidebar-order-item--static sidebar-order-item--compact"
                  >
                    <div className="sidebar-order-item__left">
                      <span className="sidebar-order-item__icon">{typeInfo.icon}</span>
                      <span className="sidebar-order-item__number">№{idx + 1}</span>
                    </div>
                    {/* Статус с текстом */}
                    <span className={`badge ${STATUS_BADGE[order.status] ?? 'badge-blue'} sidebar-order-item__badge`}>
                      <span className="status-dot" style={{ background: STATUS_DOT[order.status] ?? 'var(--info)' }} />
                      {STATUS_LABELS[order.status]}
                    </span>
                  </div>
                );
              })
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
                  {client.phone} {client.email && <>&nbsp;·&nbsp;{client.email}</>}
                </div>
              </div>
            </div>
            {isEditing ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setEditForm({
                      last_name: client.last_name ?? '',
                      first_name: client.first_name ?? '',
                      middle_name: client.middle_name ?? '',
                      phone: client.phone ?? '',
                      email: client.email ?? '',
                    });
                    setIsEditing(false);
                  }}
                >
                  Отмена
                </button>
                <button className="btn btn-primary btn-sm" onClick={saveClient} disabled={saving}>
                  {saving ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            ) : (
              <button className="btn btn-ghost btn-sm" onClick={() => setIsEditing(true)}>
                ✎ Редактировать
              </button>
            )}
          </div>

          <div className="client-info-block">
            <div className="cib-item">
              <div className="cib-label">Телефон</div>
              {isEditing ? (
                <input
                  className="form-input"
                  value={editForm.phone}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                />
              ) : (
                <div className="cib-val">{client.phone || '—'}</div>
              )}
            </div>
            <div className="cib-item">
              <div className="cib-label">E-mail</div>
              {isEditing ? (
                <input
                  className="form-input"
                  value={editForm.email}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                />
              ) : (
                <div className="cib-val">{client.email || '—'}</div>
              )}
            </div>
            <div className="cib-item">
              <div className="cib-label">Добавлен</div>
              <div className="cib-val">{formatDate(client.created_at)}</div>
            </div>
          </div>

          {isEditing && (
            <div className="client-info-block" style={{ marginTop: -8 }}>
              <div className="cib-item">
                <div className="cib-label">Фамилия</div>
                <input
                  className="form-input"
                  value={editForm.last_name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, last_name: e.target.value }))}
                />
              </div>
              <div className="cib-item">
                <div className="cib-label">Имя</div>
                <input
                  className="form-input"
                  value={editForm.first_name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, first_name: e.target.value }))}
                />
              </div>
              <div className="cib-item">
                <div className="cib-label">Отчество</div>
                <input
                  className="form-input"
                  value={editForm.middle_name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, middle_name: e.target.value }))}
                />
              </div>
            </div>
          )}

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

          {sortedOrders.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 20px' }}>
              <div className="empty-icon">📋</div>
              <div>Расчётов пока нет</div>
            </div>
          ) : (
            sortedOrders.map((order, idx) => {
              const typeInfo = CALC_TYPE_LABELS[order.calc_type];
              return (
                <div 
                  className="result-section result-section--clickable" 
                  key={order.id}
                  onClick={() => navigate(`/orders/${order.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="result-section-header">
                    <div className="result-section-title">
                      {typeInfo.icon} Расчёт №{idx + 1}
                      <span className={`badge ${STATUS_BADGE[order.status] ?? 'badge-blue'}`} style={{ fontSize: 10 }}>
                        {STATUS_LABELS[order.status]}
                      </span>
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
        </div>
      </div>
      <Footer />
    </div>
  );
}