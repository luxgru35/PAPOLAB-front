import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Topbar } from '../components/layout/Topbar';
import { ordersApi } from '../api/orders';
import { formatMinor, STATUS_LABELS, CALC_TYPE_LABELS } from '../types/order';
import type { Order, PriceLine } from '../types/order';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
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

const NEXT_STATUS: Record<string, string> = {
  accepted: 'in_progress',
  in_progress: 'delivered',
};
const NEXT_STATUS_LABEL: Record<string, string> = {
  accepted: 'Взять в работу',
  in_progress: 'Заключить договор',
};

export default function OrderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const load = async () => {
    if (!id) return;
    try {
      const data = await ordersApi.get(id);
      setOrder(data);
    } catch {
      setError('Не удалось загрузить расчёт');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleStatusUpdate = async () => {
    if (!order) return;
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    setStatusLoading(true);
    try {
      const updated = await ordersApi.updateStatus(order.id, next);
      setOrder(updated);
    } catch {
      // ignore
    } finally {
      setStatusLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="app-shell">
        <Topbar />
        <div className="empty-state" style={{ marginTop: 60 }}>
          <div className="empty-icon">⏳</div>
          <div>Загрузка расчёта...</div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="app-shell">
        <Topbar />
        <div className="empty-state" style={{ marginTop: 60 }}>
          <div className="empty-icon">⚠️</div>
          <div>{error ?? 'Расчёт не найден'}</div>
          <button className="btn btn-ghost" style={{ marginTop: 16 }} onClick={() => navigate(-1)}>← Назад</button>
        </div>
      </div>
    );
  }

  const typeInfo = CALC_TYPE_LABELS[order.calc_type];
  const lines: PriceLine[] = order.price_snapshot?.lines ?? [];
  const total = order.total_cost_minor;
  const missing = order.price_snapshot?.missing_price_keys ?? [];

  return (
    <div className="app-shell">
      <Topbar />
      <div className="layout-with-sidebar" style={{ flex: 1, minHeight: 'calc(100vh - 56px)' }}>
        {/* ── Sidebar ── */}
        <div className="sidebar">
          <div className="sidebar-section">Элементы</div>
          <div className="sidebar-item active">
            {typeInfo.icon} {typeInfo.label}
          </div>
          <div style={{ marginTop: 12, padding: '0 8px' }}>
            <button
              className="btn btn-ghost btn-sm"
              style={{ width: '100%', fontSize: 11 }}
              onClick={() => navigate(`/clients/${order.client_id}/new-order`)}
            >
              + Добавить элемент
            </button>
          </div>

          <div className="sidebar-section" style={{ marginTop: 20 }}>Статус</div>
          <div style={{ padding: '8px 12px' }}>
            <span
              className={`badge ${STATUS_BADGE[order.status] ?? 'badge-blue'}`}
              style={{ fontSize: 10, display: 'block', textAlign: 'center', padding: '5px 8px' }}
            >
              <span className="status-dot" style={{ background: STATUS_DOT[order.status] ?? 'var(--info)' }} />
              {STATUS_LABELS[order.status]}
            </span>
          </div>

          {NEXT_STATUS[order.status] && (
            <div style={{ padding: '8px 12px', marginTop: 4 }}>
              <button
                className="btn btn-ghost btn-sm"
                style={{ width: '100%', fontSize: 11 }}
                onClick={handleStatusUpdate}
                disabled={statusLoading}
              >
                {statusLoading ? '...' : NEXT_STATUS_LABEL[order.status]}
              </button>
            </div>
          )}
        </div>

        {/* ── Content ── */}
        <div className="content" style={{ padding: '20px 24px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div className="breadcrumb" style={{ marginBottom: 8 }}>
                <Link to="/clients">Клиенты</Link>
                <span className="breadcrumb-sep">›</span>
                <Link to={`/clients/${order.client_id}`}>Карточка</Link>
                <span className="breadcrumb-sep">›</span>
                <span>Расчёт</span>
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: '.04em', marginBottom: 2 }}>
                Смета расчёта
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Создан: {formatDate(order.created_at)} · Версия {order.calc_version}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost btn-sm">📄 Экспорт</button>
            </div>
          </div>

          {/* Two-column layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Left: line items */}
            <div>
              <div className="result-section">
                <div className="result-section-header">
                  <div className="result-section-title">{typeInfo.icon} {typeInfo.label}</div>
                </div>
                <div className="result-section-body">
                  {lines.length === 0 ? (
                    <div style={{ padding: '16px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                      Нет данных о материалах
                    </div>
                  ) : (
                    lines.map((line) => (
                      <div className="stat-row" key={line.key}>
                        <span className="stat-key">{line.name}</span>
                        <span className="stat-val">
                          {line.quantity} {line.unit}
                          {line.total_minor > 0 && (
                            <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>
                              {formatMinor(line.total_minor)}
                            </span>
                          )}
                        </span>
                      </div>
                    ))
                  )}
                  <div className="stat-row" style={{ borderTop: '1px solid var(--border)', marginTop: 4, paddingTop: 12 }}>
                    <span className="stat-key" style={{ fontWeight: 600, color: 'var(--text)' }}>Итого материалы</span>
                    <span className="stat-val accent">{formatMinor(total)}</span>
                  </div>
                </div>
              </div>

              {missing.length > 0 && (
                <div className="toast" style={{ borderLeftColor: 'var(--warning)', fontSize: 12 }}>
                  ⚠️ Не найдены цены для: {missing.join(', ')}
                </div>
              )}
            </div>

            {/* Right: summary */}
            <div>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--text-muted)', marginBottom: 12 }}>
                Сводная информация
              </div>

              <div className="card" style={{ marginBottom: 16 }}>
                <div className="card-title">Тип расчёта</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{typeInfo.icon} {typeInfo.label}</div>
              </div>

              <div className="card" style={{ marginBottom: 16 }}>
                <div className="card-title" style={{ marginBottom: 12 }}>Параметры расчёта</div>
                <div className="stat-row" style={{ fontSize: 12 }}>
                  <span className="stat-key">Статус</span>
                  <span>
                    <span className={`badge ${STATUS_BADGE[order.status]}`} style={{ fontSize: 10 }}>
                      {STATUS_LABELS[order.status]}
                    </span>
                  </span>
                </div>
                <div className="stat-row" style={{ fontSize: 12 }}>
                  <span className="stat-key">Создан</span>
                  <span className="stat-val">{formatDate(order.created_at)}</span>
                </div>
                <div className="stat-row" style={{ fontSize: 12 }}>
                  <span className="stat-key">Позиций в смете</span>
                  <span className="stat-val">{lines.length}</span>
                </div>
              </div>

              <div className="total-row">
                <div>
                  <div className="total-label">Итого по смете</div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Финальная стоимость</div>
                </div>
                <div className="total-value">
                  {new Intl.NumberFormat('ru-RU').format(Math.round(total / 100))} <small>₽</small>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                {NEXT_STATUS[order.status] && (
                  <button
                    className="btn btn-ghost"
                    style={{ flex: 1, fontSize: 12 }}
                    onClick={handleStatusUpdate}
                    disabled={statusLoading}
                  >
                    {NEXT_STATUS_LABEL[order.status]}
                  </button>
                )}
                <button
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  onClick={() => navigate(`/clients/${order.client_id}/new-order`)}
                >
                  + Доб. элемент
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
