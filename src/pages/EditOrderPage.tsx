import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Topbar } from '../components/layout/Topbar';
import { ordersApi } from '../api/orders';
import type { FoundationInput, FrameInput, Order } from '../types/order';
import { Footer } from '../components/layout/Footer';

type FrameForm = {
  length: number;
  width: number;
  height: number;
  floors: number;
  inner_walls: number;
  windows: number;
  ext_doors: number;
  int_doors: number;
  outer_wall_mm: number;
  inner_wall_mm: number;
  overlap_mm: number;
  outer_osb_id: string;
  outer_vapor_id: string;
  outer_wind_id: string;
  outer_ins_id: string;
  inner_osb_id: string;
  overlap_osb_id: string;
  overlap_vapor_id: string;
  overlap_wind_id: string;
  overlap_ins_id: string;
};

type FoundationForm = {
  outer_perimeter: number;
  inner_walls: number;
  board_thickness: number;
  timber_length: number;
  pile_type_id: string;
  concrete_type_id: string;
};

const defaultFrame: FrameForm = {
  length: 10,
  width: 8,
  height: 3,
  floors: 1,
  inner_walls: 4,
  windows: 8,
  ext_doors: 2,
  int_doors: 4,
  outer_wall_mm: 150,
  inner_wall_mm: 100,
  overlap_mm: 200,
  outer_osb_id: 'osb-12mm',
  outer_vapor_id: 'vapor-basic',
  outer_wind_id: 'wind-basic',
  outer_ins_id: 'insulation-150',
  inner_osb_id: 'osb-9mm',
  overlap_osb_id: 'osb-12mm',
  overlap_vapor_id: 'vapor-basic',
  overlap_wind_id: 'wind-basic',
  overlap_ins_id: 'insulation-150',
};

const defaultFoundation: FoundationForm = {
  outer_perimeter: 36,
  inner_walls: 10,
  board_thickness: 0.025,
  timber_length: 3,
  pile_type_id: 'pile-p1',
  concrete_type_id: 'concrete-b20',
};

function asNumber(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function deriveLengthWidth(perimeter: number, area: number): { length: number; width: number } {
  const halfP = perimeter / 2;
  const disc = halfP * halfP - 4 * area;
  if (disc <= 0) return { length: 10, width: 8 };
  const root = Math.sqrt(disc);
  const l = (halfP + root) / 2;
  const w = (halfP - root) / 2;
  if (!Number.isFinite(l) || !Number.isFinite(w) || l <= 0 || w <= 0) return { length: 10, width: 8 };
  return { length: Math.max(l, w), width: Math.min(l, w) };
}

export default function EditOrderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [frameForm, setFrameForm] = useState<FrameForm>(defaultFrame);
  const [foundationForm, setFoundationForm] = useState<FoundationForm>(defaultFoundation);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await ordersApi.get(id);
        setOrder(data);

        if (data.calc_type === 'frame') {
          const input = ((data.input ?? data.input_json) ?? {}) as Partial<FrameInput>;
          const floor = input.floors?.[0];
          const dims = floor
            ? deriveLengthWidth(
                asNumber(floor.outer_perimeter_m, defaultFrame.length * 2 + defaultFrame.width * 2),
                asNumber(floor.base_area_m2, defaultFrame.length * defaultFrame.width)
              )
            : { length: defaultFrame.length, width: defaultFrame.width };

          setFrameForm({
            length: dims.length,
            width: dims.width,
            height: asNumber(floor?.height_m, defaultFrame.height),
            floors: input.floors?.length ?? defaultFrame.floors,
            inner_walls: floor ? asNumber(floor.inner_walls_length_m, defaultFrame.inner_walls * dims.width) / Math.max(dims.width, 1) : defaultFrame.inner_walls,
            windows: input.windows?.[0]?.count ?? defaultFrame.windows,
            ext_doors: input.external_doors?.[0]?.count ?? defaultFrame.ext_doors,
            int_doors: input.internal_doors?.[0]?.count ?? defaultFrame.int_doors,
            outer_wall_mm: asNumber(floor?.outer_wall_thickness_mm, defaultFrame.outer_wall_mm),
            inner_wall_mm: asNumber(floor?.inner_wall_thickness_mm, defaultFrame.inner_wall_mm),
            overlap_mm: asNumber(input.overlap_thickness_mm, defaultFrame.overlap_mm),
            outer_osb_id: input.outer_osb_id ?? defaultFrame.outer_osb_id,
            outer_vapor_id: input.outer_vapor_barrier_id ?? defaultFrame.outer_vapor_id,
            outer_wind_id: input.outer_wind_protection_id ?? defaultFrame.outer_wind_id,
            outer_ins_id: input.outer_insulation_id ?? defaultFrame.outer_ins_id,
            inner_osb_id: input.inner_osb_id ?? defaultFrame.inner_osb_id,
            overlap_osb_id: input.overlap_osb_id ?? defaultFrame.overlap_osb_id,
            overlap_vapor_id: input.overlap_vapor_barrier_id ?? defaultFrame.overlap_vapor_id,
            overlap_wind_id: input.overlap_wind_protection_id ?? defaultFrame.overlap_wind_id,
            overlap_ins_id: input.overlap_insulation_id ?? defaultFrame.overlap_ins_id,
          });
        } else {
          const input = ((data.input ?? data.input_json) ?? {}) as Partial<FoundationInput>;
          setFoundationForm({
            outer_perimeter: asNumber(input.outer_perimeter_m, defaultFoundation.outer_perimeter),
            inner_walls: asNumber(input.inner_walls_length_m, defaultFoundation.inner_walls),
            board_thickness: asNumber(input.formwork_board_thickness_m, defaultFoundation.board_thickness),
            timber_length: asNumber(input.formwork_timber_length_m, defaultFoundation.timber_length),
            pile_type_id: input.pile_type_id ?? defaultFoundation.pile_type_id,
            concrete_type_id: input.concrete_type_id ?? defaultFoundation.concrete_type_id,
          });
        }
      } catch {
        setError('Не удалось загрузить расчёт');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const submit = async () => {
    if (!id || !order) return;
    try {
      setSaving(true);
      setError(null);
      let payload: FoundationInput | FrameInput;

      if (order.calc_type === 'frame') {
        const perimeter = (frameForm.length + frameForm.width) * 2;
        const area = frameForm.length * frameForm.width;
        const floor = {
          height_m: frameForm.height,
          outer_perimeter_m: perimeter,
          base_area_m2: area,
          outer_wall_thickness_mm: Math.round(frameForm.outer_wall_mm),
          inner_walls_length_m: frameForm.inner_walls * frameForm.width,
          inner_wall_thickness_mm: Math.round(frameForm.inner_wall_mm),
        };
        payload = {
          floors: Array(Math.max(1, Math.floor(frameForm.floors))).fill(floor),
          external_doors: frameForm.ext_doors > 0 ? [{ width_m: 1.0, height_m: 2.1, count: Math.floor(frameForm.ext_doors) }] : [],
          internal_doors: frameForm.int_doors > 0 ? [{ width_m: 0.9, height_m: 2.1, count: Math.floor(frameForm.int_doors) }] : [],
          windows: frameForm.windows > 0 ? [{ width_m: 1.2, height_m: 1.4, count: Math.floor(frameForm.windows) }] : [],
          outer_osb_id: frameForm.outer_osb_id,
          outer_vapor_barrier_id: frameForm.outer_vapor_id,
          outer_wind_protection_id: frameForm.outer_wind_id,
          outer_insulation_id: frameForm.outer_ins_id,
          inner_osb_id: frameForm.inner_osb_id,
          overlap_thickness_mm: Math.round(frameForm.overlap_mm),
          overlap_osb_id: frameForm.overlap_osb_id,
          overlap_vapor_barrier_id: frameForm.overlap_vapor_id,
          overlap_wind_protection_id: frameForm.overlap_wind_id,
          overlap_insulation_id: frameForm.overlap_ins_id,
        };
      } else {
        payload = {
          outer_perimeter_m: foundationForm.outer_perimeter,
          inner_walls_length_m: foundationForm.inner_walls,
          pile_type_id: foundationForm.pile_type_id,
          concrete_type_id: foundationForm.concrete_type_id,
          formwork_board_thickness_m: foundationForm.board_thickness,
          formwork_timber_length_m: foundationForm.timber_length,
        };
      }

      const updated = await ordersApi.recalc(id, payload);
      navigate(`/orders/${updated.id}`, { replace: true });
    } catch {
      setError('Не удалось пересчитать. Проверьте заполненные параметры и доступность API.');
    } finally {
      setSaving(false);
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

  if (!order) {
    return (
      <div className="app-shell">
        <Topbar />
        <div className="empty-state" style={{ marginTop: 60 }}>
          <div className="empty-icon">⚠️</div>
          <div>{error ?? 'Расчёт не найден'}</div>
          <button className="btn btn-ghost" style={{ marginTop: 16 }} onClick={() => navigate('/calculations')}>
            ← Назад
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Topbar />
      <main className="page-content">
        <div className="breadcrumb">
          <Link to="/calculations">Расчёты</Link>
          <span className="breadcrumb-sep">›</span>
          <Link to={`/orders/${order.id}`}>Расчёт</Link>
          <span className="breadcrumb-sep">›</span>
          <span>Редактирование</span>
        </div>

        <div className="page-header">
          <div>
            <div className="page-title-text">Редактирование расчёта</div>
            <div className="page-subtitle">Измените входные параметры и пересчитайте существующий расчёт</div>
          </div>
        </div>

        {error && (
          <div className="toast toast--visible" role="alert" style={{ marginBottom: 16 }}>
            {error}
          </div>
        )}

        <div className="card">
          <div className="card-title">Входные параметры</div>
          {order.calc_type === 'frame' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <input className="form-input" type="number" value={frameForm.length} onChange={(e) => setFrameForm((p) => ({ ...p, length: asNumber(e.target.value, p.length) }))} placeholder="Длина, м" />
              <input className="form-input" type="number" value={frameForm.width} onChange={(e) => setFrameForm((p) => ({ ...p, width: asNumber(e.target.value, p.width) }))} placeholder="Ширина, м" />
              <input className="form-input" type="number" value={frameForm.height} onChange={(e) => setFrameForm((p) => ({ ...p, height: asNumber(e.target.value, p.height) }))} placeholder="Высота, м" />
              <input className="form-input" type="number" value={frameForm.floors} onChange={(e) => setFrameForm((p) => ({ ...p, floors: asNumber(e.target.value, p.floors) }))} placeholder="Этажи" />
              <input className="form-input" type="number" value={frameForm.inner_walls} onChange={(e) => setFrameForm((p) => ({ ...p, inner_walls: asNumber(e.target.value, p.inner_walls) }))} placeholder="Внутренние перегородки" />
              <input className="form-input" type="number" value={frameForm.windows} onChange={(e) => setFrameForm((p) => ({ ...p, windows: asNumber(e.target.value, p.windows) }))} placeholder="Окна" />
              <input className="form-input" type="number" value={frameForm.ext_doors} onChange={(e) => setFrameForm((p) => ({ ...p, ext_doors: asNumber(e.target.value, p.ext_doors) }))} placeholder="Внешние двери" />
              <input className="form-input" type="number" value={frameForm.int_doors} onChange={(e) => setFrameForm((p) => ({ ...p, int_doors: asNumber(e.target.value, p.int_doors) }))} placeholder="Внутренние двери" />
              <input className="form-input" type="number" value={frameForm.outer_wall_mm} onChange={(e) => setFrameForm((p) => ({ ...p, outer_wall_mm: asNumber(e.target.value, p.outer_wall_mm) }))} placeholder="Толщина внешней стены, мм" />
              <input className="form-input" type="number" value={frameForm.inner_wall_mm} onChange={(e) => setFrameForm((p) => ({ ...p, inner_wall_mm: asNumber(e.target.value, p.inner_wall_mm) }))} placeholder="Толщина внутренней стены, мм" />
              <input className="form-input" type="number" value={frameForm.overlap_mm} onChange={(e) => setFrameForm((p) => ({ ...p, overlap_mm: asNumber(e.target.value, p.overlap_mm) }))} placeholder="Толщина перекрытия, мм" />
              <select className="form-input" value={frameForm.outer_ins_id} onChange={(e) => setFrameForm((p) => ({ ...p, outer_ins_id: e.target.value, overlap_ins_id: e.target.value }))}>
                <option value="insulation-50">Утеплитель 50 мм</option>
                <option value="insulation-100">Утеплитель 100 мм</option>
                <option value="insulation-150">Утеплитель 150 мм</option>
                <option value="insulation-200">Утеплитель 200 мм</option>
              </select>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <input className="form-input" type="number" value={foundationForm.outer_perimeter} onChange={(e) => setFoundationForm((p) => ({ ...p, outer_perimeter: asNumber(e.target.value, p.outer_perimeter) }))} placeholder="Внешний периметр, м" />
              <input className="form-input" type="number" value={foundationForm.inner_walls} onChange={(e) => setFoundationForm((p) => ({ ...p, inner_walls: asNumber(e.target.value, p.inner_walls) }))} placeholder="Длина внутренних стен, м" />
              <input className="form-input" type="number" value={foundationForm.board_thickness} onChange={(e) => setFoundationForm((p) => ({ ...p, board_thickness: asNumber(e.target.value, p.board_thickness) }))} placeholder="Толщина доски, м" />
              <input className="form-input" type="number" value={foundationForm.timber_length} onChange={(e) => setFoundationForm((p) => ({ ...p, timber_length: asNumber(e.target.value, p.timber_length) }))} placeholder="Длина бруса, м" />
              <select className="form-input" value={foundationForm.pile_type_id} onChange={(e) => setFoundationForm((p) => ({ ...p, pile_type_id: e.target.value }))}>
                <option value="pile-p1">Свая P1</option>
                <option value="pile-p2">Свая P2</option>
              </select>
              <select className="form-input" value={foundationForm.concrete_type_id} onChange={(e) => setFoundationForm((p) => ({ ...p, concrete_type_id: e.target.value }))}>
                <option value="concrete-b20">Бетон B20</option>
                <option value="concrete-b25">Бетон B25</option>
              </select>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <button className="btn btn-ghost" onClick={() => navigate(`/orders/${order.id}`)}>
              Отмена
            </button>
            <button className="btn btn-primary" onClick={submit} disabled={saving}>
              {saving ? 'Пересчёт...' : 'Сохранить и пересчитать'}
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
