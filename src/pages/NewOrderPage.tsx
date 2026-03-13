import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Topbar } from '../components/layout/Topbar';
import { ordersApi } from '../api/orders';
import type { CalcType, FrameInput, FoundationInput } from '../types/order';

// ── Step types ──────────────────────────────────────
type Step = 'select' | 'params' | 'loading';

// ── Frame default form ───────────────────────────────
const defaultFrame = {
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

const defaultFoundation = {
  outer_perimeter: 36,
  inner_walls: 10,
  board_thickness: 0.025,
  timber_length: 3,
  pile_type_id: 'pile-p1',
  concrete_type_id: 'concrete-b20',
};

// ── Steps indicator ──────────────────────────────────
function Steps({ step }: { step: Step }) {
  const steps = [
    { key: 'select', label: 'Элемент' },
    { key: 'params', label: 'Параметры' },
    { key: 'loading', label: 'Расчёт' },
  ];
  const idx = steps.findIndex((s) => s.key === step);
  return (
    <div className="steps" style={{ marginBottom: 24 }}>
      {steps.map((s, i) => (
        <>
          <div key={s.key} className={`step ${i < idx ? 'done' : i === idx ? 'active' : ''}`}>
            <div className="step-circle">{i < idx ? '✓' : i + 1}</div>
            <div className="step-label" style={{ fontSize: 11 }}>{s.label}</div>
          </div>
          {i < steps.length - 1 && (
            <div key={`line-${i}`} className="step-line" style={{ background: i < idx ? 'var(--accent)' : 'var(--border)' }} />
          )}
        </>
      ))}
    </div>
  );
}

// ── NumInput ─────────────────────────────────────────
function NumInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="num-input">
      <button className="num-btn" onClick={() => onChange(Math.max(0, value - 1))}>−</button>
      <input className="num-field" value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <button className="num-btn" onClick={() => onChange(value + 1)}>+</button>
    </div>
  );
}

// ── InputUnit ─────────────────────────────────────────
function InputUnit({
  label, value, unit, onChange, required,
}: {
  label: string; value: number; unit: string; onChange: (v: number) => void; required?: boolean;
}) {
  return (
    <div className="form-group">
      <label className="form-label">{label}{required ? ' *' : ''}</label>
      <div className="input-with-unit">
        <input
          className="form-input"
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <span className="input-unit">{unit}</span>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────
export default function NewOrderPage() {
  const { id: clientId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('select');
  const [calcType, setCalcType] = useState<CalcType>('frame');
  const [frameForm, setFrameForm] = useState(defaultFrame);
  const [foundForm, setFoundForm] = useState(defaultFoundation);
  const [apiError, setApiError] = useState<string | null>(null);

  const setFF = <K extends keyof typeof defaultFrame>(k: K, v: typeof defaultFrame[K]) =>
    setFrameForm((p) => ({ ...p, [k]: v }));
  const setFnd = <K extends keyof typeof defaultFoundation>(k: K, v: typeof defaultFoundation[K]) =>
    setFoundForm((p) => ({ ...p, [k]: v }));

  const buildFrameInput = (): FrameInput => {
    const perimeter = (frameForm.length + frameForm.width) * 2;
    const area = frameForm.length * frameForm.width;
    const floor = {
      height_m: frameForm.height,
      outer_perimeter_m: perimeter,
      base_area_m2: area,
      outer_wall_thickness_mm: frameForm.outer_wall_mm,
      inner_walls_length_m: frameForm.inner_walls * frameForm.width,
      inner_wall_thickness_mm: frameForm.inner_wall_mm,
    };
    return {
      floors: Array(frameForm.floors).fill(floor),
      external_doors: [{ width_m: 1.0, height_m: 2.1, count: frameForm.ext_doors }],
      internal_doors: [{ width_m: 0.9, height_m: 2.1, count: frameForm.int_doors }],
      windows: [{ width_m: 1.2, height_m: 1.4, count: frameForm.windows }],
      outer_osb_id: frameForm.outer_osb_id,
      outer_vapor_barrier_id: frameForm.outer_vapor_id,
      outer_wind_protection_id: frameForm.outer_wind_id,
      outer_insulation_id: frameForm.outer_ins_id,
      inner_osb_id: frameForm.inner_osb_id,
      overlap_thickness_mm: frameForm.overlap_mm,
      overlap_osb_id: frameForm.overlap_osb_id,
      overlap_vapor_barrier_id: frameForm.overlap_vapor_id,
      overlap_wind_protection_id: frameForm.overlap_wind_id,
      overlap_insulation_id: frameForm.overlap_ins_id,
    };
  };

  const buildFoundationInput = (): FoundationInput => ({
    outer_perimeter_m: foundForm.outer_perimeter,
    inner_walls_length_m: foundForm.inner_walls,
    pile_type_id: foundForm.pile_type_id,
    concrete_type_id: foundForm.concrete_type_id,
    formwork_board_thickness_m: foundForm.board_thickness,
    formwork_timber_length_m: foundForm.timber_length,
  });

  const handleCalculate = async () => {
    if (!clientId) return;
    setStep('loading');
    setApiError(null);
    try {
      const input = calcType === 'frame' ? buildFrameInput() : buildFoundationInput();
      const order = await ordersApi.create(clientId, { calc_type: calcType, input });
      navigate(`/orders/${order.id}`);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Ошибка при расчёте';
      setApiError(msg);
      setStep('params');
    }
  };

  return (
    <div className="app-shell">
      <Topbar />
      <main className="page-content" style={{ maxWidth: 860 }}>
        <div className="breadcrumb">
          <Link to="/clients">Клиенты</Link>
          <span className="breadcrumb-sep">›</span>
          <Link to={`/clients/${clientId}`}>Карточка</Link>
          <span className="breadcrumb-sep">›</span>
          <span>Новый расчёт</span>
        </div>

        <Steps step={step} />

        {apiError && (
          <div className="toast" style={{ borderLeftColor: 'var(--danger)', marginBottom: 16 }}>
            ❌ {apiError}
          </div>
        )}

        {/* ── Step 1: Select type ── */}
        {step === 'select' && (
          <div style={{ maxWidth: 460 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 19, letterSpacing: '.04em', marginBottom: 4 }}>
              Конструктивный элемент
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
              Выберите элемент для расчёта стоимости
            </div>

            <div
              className={`choice-card ${calcType === 'frame' ? 'selected' : ''}`}
              onClick={() => setCalcType('frame')}
            >
              <div className="choice-icon">🏗️</div>
              <div>
                <div className="choice-title">Каркас и перекрытия</div>
                <div className="choice-desc">Установка каркаса, перекрытий, расчёт материалов по заданным параметрам</div>
              </div>
              <div style={{ marginLeft: 'auto', color: calcType === 'frame' ? 'var(--accent)' : 'var(--text-dim)', fontSize: 18 }}>
                {calcType === 'frame' ? '◉' : '○'}
              </div>
            </div>

            <div
              className={`choice-card ${calcType === 'foundation' ? 'selected' : ''}`}
              onClick={() => setCalcType('foundation')}
            >
              <div className="choice-icon">🔩</div>
              <div>
                <div className="choice-title">Фундамент</div>
                <div className="choice-desc">Обустройство свайного фундамента, расчёт бетона и опалубки</div>
              </div>
              <div style={{ marginLeft: 'auto', color: calcType === 'foundation' ? 'var(--accent)' : 'var(--text-dim)', fontSize: 18 }}>
                {calcType === 'foundation' ? '◉' : '○'}
              </div>
            </div>

            <div className="choice-card" style={{ opacity: .4, cursor: 'not-allowed' }}>
              <div className="choice-icon">🏠</div>
              <div>
                <div className="choice-title">Кровля</div>
                <div className="choice-desc">Будет доступно в следующей версии</div>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <span className="badge badge-yellow" style={{ fontSize: 10 }}>Скоро</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => navigate(`/clients/${clientId}`)}>
                Отмена
              </button>
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={() => setStep('params')}>
                Перейти к расчёту →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Params (Frame) ── */}
        {step === 'params' && calcType === 'frame' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, background: 'rgba(232,163,74,.12)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🏗️</div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 19, letterSpacing: '.04em' }}>Каркас и перекрытия</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Заполните параметры строительства</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div>
                <div className="sec-subheading">Размеры дома</div>
                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <InputUnit label="Длина" value={frameForm.length} unit="м" onChange={(v) => setFF('length', v)} required />
                  <InputUnit label="Ширина" value={frameForm.width} unit="м" onChange={(v) => setFF('width', v)} required />
                </div>
                <InputUnit label="Высота этажа" value={frameForm.height} unit="м" onChange={(v) => setFF('height', v)} required />
                <div className="form-group">
                  <label className="form-label">Количество этажей *</label>
                  <NumInput value={frameForm.floors} onChange={(v) => setFF('floors', Math.max(1, v))} />
                </div>

                <div className="sec-subheading">Толщины стен</div>
                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <InputUnit label="Внешняя стена" value={frameForm.outer_wall_mm} unit="мм" onChange={(v) => setFF('outer_wall_mm', v)} />
                  <InputUnit label="Внутренняя стена" value={frameForm.inner_wall_mm} unit="мм" onChange={(v) => setFF('inner_wall_mm', v)} />
                </div>
                <InputUnit label="Толщина перекрытия" value={frameForm.overlap_mm} unit="мм" onChange={(v) => setFF('overlap_mm', v)} />
              </div>

              <div>
                <div className="sec-subheading">Стены и проёмы</div>
                <div className="form-group">
                  <label className="form-label">Внутренние перегородки</label>
                  <NumInput value={frameForm.inner_walls} onChange={(v) => setFF('inner_walls', Math.max(0, v))} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Окна</label>
                    <NumInput value={frameForm.windows} onChange={(v) => setFF('windows', Math.max(0, v))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Внешние двери</label>
                    <NumInput value={frameForm.ext_doors} onChange={(v) => setFF('ext_doors', Math.max(0, v))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Внутренние двери</label>
                  <NumInput value={frameForm.int_doors} onChange={(v) => setFF('int_doors', Math.max(0, v))} />
                </div>

                <div className="sec-subheading">Материалы</div>
                <div className="form-group">
                  <label className="form-label">Утеплитель</label>
                  <div className="tag-select">
                    {['insulation-50', 'insulation-100', 'insulation-150', 'insulation-200'].map((id) => (
                      <div
                        key={id}
                        className={`tag-option ${frameForm.outer_ins_id === id ? 'sel' : ''}`}
                        onClick={() => setFF('outer_ins_id', id)}
                      >
                        {id.replace('insulation-', '')} мм
                      </div>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">ОСБ (внешние стены)</label>
                  <div className="tag-select">
                    {['osb-9mm', 'osb-12mm'].map((id) => (
                      <div
                        key={id}
                        className={`tag-option ${frameForm.outer_osb_id === id ? 'sel' : ''}`}
                        onClick={() => setFF('outer_osb_id', id)}
                      >
                        {id.replace('osb-', '')}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <button className="btn btn-ghost" onClick={() => setStep('select')}>← Назад</button>
              <button className="btn btn-primary" style={{ padding: '9px 28px', fontSize: 14 }} onClick={handleCalculate}>
                Рассчитать →
              </button>
            </div>
          </>
        )}

        {/* ── Step 2: Params (Foundation) ── */}
        {step === 'params' && calcType === 'foundation' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, background: 'rgba(232,163,74,.12)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🔩</div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 19, letterSpacing: '.04em' }}>Фундамент</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Свайный фундамент — параметры расчёта</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div>
                <div className="sec-subheading">Параметры</div>
                <InputUnit label="Внешний периметр" value={foundForm.outer_perimeter} unit="м" onChange={(v) => setFnd('outer_perimeter', v)} required />
                <InputUnit label="Длина внутренних стен" value={foundForm.inner_walls} unit="м" onChange={(v) => setFnd('inner_walls', v)} />
                <InputUnit label="Толщина доски опалубки" value={foundForm.board_thickness} unit="м" onChange={(v) => setFnd('board_thickness', v)} required />
                <InputUnit label="Длина бруса опалубки" value={foundForm.timber_length} unit="м" onChange={(v) => setFnd('timber_length', v)} required />
              </div>
              <div>
                <div className="sec-subheading">Тип сваи</div>
                <div className="tag-select">
                  {['pile-p1', 'pile-p2'].map((id) => (
                    <div
                      key={id}
                      className={`tag-option ${foundForm.pile_type_id === id ? 'sel' : ''}`}
                      onClick={() => setFnd('pile_type_id', id)}
                    >
                      {id.replace('pile-', 'P').toUpperCase()}
                    </div>
                  ))}
                </div>

                <div className="sec-subheading">Марка бетона</div>
                <div className="tag-select">
                  {['concrete-b20', 'concrete-b25'].map((id) => (
                    <div
                      key={id}
                      className={`tag-option ${foundForm.concrete_type_id === id ? 'sel' : ''}`}
                      onClick={() => setFnd('concrete_type_id', id)}
                    >
                      {id.replace('concrete-', '').toUpperCase()}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <button className="btn btn-ghost" onClick={() => setStep('select')}>← Назад</button>
              <button className="btn btn-primary" style={{ padding: '9px 28px', fontSize: 14 }} onClick={handleCalculate}>
                Рассчитать →
              </button>
            </div>
          </>
        )}

        {/* ── Step 3: Loading ── */}
        {step === 'loading' && (
          <div className="empty-state" style={{ padding: '60px 20px' }}>
            <div className="empty-icon">⚙️</div>
            <div style={{ fontSize: 16, fontFamily: 'var(--font-display)', letterSpacing: '.04em' }}>
              Выполняется расчёт...
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
