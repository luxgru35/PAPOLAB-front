import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Topbar } from '../components/layout/Topbar';
import { ordersApi } from '../api/orders';
import type { CalcType, FrameInput, FoundationInput } from '../types/order';

// ── Step types ──────────────────────────────────────
type Step = 'select' | 'params' | 'loading';

// Валидация для `frame` (подсвечиваем только то, что есть в форме)
type FrameField =
  | 'length'
  | 'width'
  | 'height'
  | 'floors'
  | 'outer_wall_mm'
  | 'inner_wall_mm'
  | 'inner_walls'
  | 'windows'
  | 'ext_doors'
  | 'int_doors'
  | 'overlap_mm'
  | 'outer_osb_id'
  | 'outer_ins_id'
  | 'materials_outer';

type FoundationField =
  | 'outer_perimeter'
  | 'inner_walls'
  | 'board_thickness'
  | 'timber_length'
  | 'pile_type_id'
  | 'concrete_type_id';

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
function NumInput({
  value,
  onChange,
  error,
}: {
  value: number;
  onChange: (v: number) => void;
  error?: string | null;
}) {
  return (
    <div className="num-input" style={error ? { outline: '2px solid rgba(231, 76, 60, .25)', borderRadius: 10, padding: 4 } : undefined}>
      <button className="num-btn" onClick={() => onChange(Math.max(0, value - 1))}>−</button>
      <input
        className="num-field"
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value);
          onChange(Number.isFinite(n) ? Math.trunc(n) : 0);
        }}
      />
      <button className="num-btn" onClick={() => onChange(value + 1)}>+</button>
      {error ? (
        <div className="field-tip-wrap field-tip-wrap--num">
          <button type="button" className="field-tip-btn" aria-label={error}>!</button>
          <div className="field-tip-bubble">{error}</div>
        </div>
      ) : null}
    </div>
  );
}

// ── InputUnit ─────────────────────────────────────────
function InputUnit({
  label, value, unit, onChange, required, error,
}: {
  label: string; value: number; unit: string; onChange: (v: number) => void; required?: boolean; error?: string | null;
}) {
  return (
    <div className="form-group">
      <label className="form-label">
        {label}{required ? ' *' : ''}{error ? <span style={{ color: 'var(--danger)' }}> *</span> : null}
      </label>
      <div className="input-with-unit">
        <input
          className="form-input"
          type="number"
          value={value}
          style={error ? { borderColor: 'var(--danger)', outline: '2px solid rgba(231, 76, 60, .25)' } : undefined}
          onChange={(e) => {
            const n = Number(e.target.value);
            onChange(Number.isFinite(n) ? n : 0);
          }}
        />
        <span className="input-unit">{unit}</span>
        {error ? (
          <div className="field-tip-wrap">
            <button type="button" className="field-tip-btn" aria-label={error}>!</button>
            <div className="field-tip-bubble">{error}</div>
          </div>
        ) : null}
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
  const [frameErrors, setFrameErrors] = useState<Partial<Record<FrameField, string>>>({});
  const [foundErrors, setFoundErrors] = useState<Partial<Record<FoundationField, string>>>({});

  const setFF = <K extends keyof typeof defaultFrame>(k: K, v: typeof defaultFrame[K]) => {
    // При правке полей снимаем подсветку ошибок и toast
    setFrameErrors({});
    setApiError(null);
    setFrameForm((p) => ({ ...p, [k]: v }));
  };
  const setFnd = <K extends keyof typeof defaultFoundation>(k: K, v: typeof defaultFoundation[K]) => {
    setFoundErrors({});
    setApiError(null);
    setFoundForm((p) => ({ ...p, [k]: v }));
  };

  const parseInsulationMmFromId = (id: string) => {
    // id формат: "insulation-150"
    const m = id.match(/^insulation-(\d+)$/);
    if (!m) return null;
    const n = Number(m[1]);
    return Number.isFinite(n) ? n : null;
  };

  const translateFrameError = (rawMsg: string) => {
    const outerInsMm = parseInsulationMmFromId(frameForm.outer_ins_id);
    const overlapInsMm = parseInsulationMmFromId(frameForm.overlap_ins_id);

    // Backend формат: "validation: <message>"
    const normalized = rawMsg.trim().replace(/^(validation|not_found|forbidden|conflict|internal)\s*:\s*/i, '');
    const lower = normalized.toLowerCase();

    if (lower === 'invalid frame input') {
      return 'Проверьте параметры каркаса: часть значений заполнена некорректно. Убедитесь, что все числовые поля больше 0, а количество окон/дверей не отрицательное.';
    }

    const minPositiveHint = (fieldLabel: string) =>
      `Значение в поле «${fieldLabel}» должно быть больше 0. Проверьте введённое значение.`;

    if (lower === 'floors must not be empty') {
      return 'Количество этажей должно быть минимум 1.';
    }
    if (lower === 'height_m must be > 0') {
      return minPositiveHint('Высота этажа');
    }
    if (lower === 'outer_perimeter_m must be > 0' || lower === 'base_area_m2 must be > 0') {
      return 'Длина и ширина должны быть больше 0. Проверьте поля «Длина» и «Ширина».';
    }
    if (lower === 'outer_wall_thickness_mm must be > 0') {
      return minPositiveHint('Толщина внешней стены');
    }
    if (lower === 'inner_wall_thickness_mm must be > 0') {
      return minPositiveHint('Толщина внутренней стены');
    }
    if (lower === 'inner_walls_length_m must be >= 0') {
      return 'Количество внутренних перегородок не может быть отрицательным.';
    }
    if (lower === 'overlap_thickness_mm must be > 0') {
      return minPositiveHint('Толщина перекрытия');
    }
    if (lower === 'openings must have width_m>0 height_m>0 count>0') {
      return 'Проверьте количество окон/дверей. Если элемент не нужен — поставьте `0` (он не будет учитываться в расчёте).';
    }

    if (lower === 'outer insulation thickness cannot exceed outer wall thickness') {
      const selected = outerInsMm != null ? `${outerInsMm} мм` : 'выбранный';
      return `Утеплитель (${selected}) не может быть толще, чем «Внешняя стена». Либо уменьшите «Утеплитель», либо увеличьте «Внешняя стена» (мм).`;
    }
    if (lower === 'overlap insulation thickness cannot exceed overlap thickness') {
      const selected = overlapInsMm != null ? `${overlapInsMm} мм` : '150 мм';
      const mm = overlapInsMm != null ? overlapInsMm : 150;
      return `Утеплитель для перекрытия (${selected}) не может быть толще, чем «Толщина перекрытия». Увеличьте «Толщина перекрытия» минимум до ${mm} мм.`;
    }

    // Catalog validation messages (rare for this UI, but keep it robust)
    const fieldInvalid = normalized.match(/^([a-z_]+)\s+is invalid$/i);
    if (fieldInvalid) {
      const field = fieldInvalid[1];
      const byField: Record<string, string> = {
        outer_osb_id: 'ОСБ (внешние стены)',
        outer_insulation_id: 'Утеплитель',
        outer_vapor_barrier_id: 'Пароизоляция (снаружи)',
        outer_wind_protection_id: 'Ветрозащита (снаружи)',
        inner_osb_id: 'ОСБ (внутренние стены)',
        overlap_osb_id: 'ОСБ (перекрытия)',
        overlap_vapor_barrier_id: 'Пароизоляция (для перекрытий)',
        overlap_wind_protection_id: 'Ветрозащита (для перекрытий)',
        overlap_insulation_id: 'Утеплитель (для перекрытий)',
      };
      const label = byField[field] ?? field;
      if (field === 'outer_osb_id' || field === 'inner_osb_id' || field === 'overlap_osb_id') {
        return 'Раздел «Материалы» -> «ОСБ (внешние стены)»: выберите один из доступных вариантов (например, 9 мм или 12 мм).';
      }
      if (field === 'outer_insulation_id' || field === 'overlap_insulation_id') {
        return 'Раздел «Материалы» -> «Утеплитель»: выберите доступную толщину (50/100/150/200 мм).';
      }
      return `Не удалось подобрать материал: поле «${label}» содержит неподдерживаемое значение. Если вы ничего не меняли на форме, вероятна проблема с каталогом материалов на сервере.`;
    }

    const fieldType = normalized.match(/^([a-z_]+)\s+has invalid type$/i);
    if (fieldType) {
      const field = fieldType[1];
      const byField: Record<string, string> = {
        outer_osb_id: 'ОСБ (внешние стены)',
        outer_insulation_id: 'Утеплитель',
        inner_osb_id: 'ОСБ (внутренние стены)',
        overlap_osb_id: 'ОСБ (перекрытия)',
      };
      const label = byField[field] ?? field;
      if (field === 'outer_osb_id' || field === 'inner_osb_id' || field === 'overlap_osb_id') {
        return `Проверьте раздел «Материалы»: «${label}» (ОСБ) не соответствует типу OSB. Обновите выбор ОСБ в форме.`;
      }
      if (field === 'outer_insulation_id' || field === 'overlap_insulation_id') {
        return `Проверьте раздел «Материалы»: «${label}» не соответствует ожидаемому типу материала. Обратитесь к менеджеру/проверьте каталог материалов на сервере.`;
      }
      return `Материал по «${label}» не соответствует ожидаемому типу. Проверьте каталог материалов на сервере.`;
    }

    return `Ошибка в параметрах каркаса: ${normalized}`;
  };

  const getFrameFieldErrors = (rawMsg: string): Partial<Record<FrameField, string>> => {
    const outerInsMm = parseInsulationMmFromId(frameForm.outer_ins_id);
    const overlapInsMm = parseInsulationMmFromId(frameForm.overlap_ins_id);

    // Backend формат: "validation: <message>"
    const normalized = rawMsg.trim().replace(/^(validation|not_found|forbidden|conflict|internal)\s*:\s*/i, '');
    const lower = normalized.toLowerCase();

    const minPositiveHint = (fieldLabel: string) => `Значение в поле «${fieldLabel}» должно быть больше 0.`;
    const openingsHint = 'Если элемент не нужен — поставьте `0`. Иначе значение должно быть больше 0.';

    const outerInsSelected = outerInsMm != null ? `${outerInsMm} мм` : 'выбранный';
    const overlapInsSelected = overlapInsMm != null ? `${overlapInsMm} мм` : 'выбранный';

    const res: Partial<Record<FrameField, string>> = {};

    if (lower === 'floors must not be empty') {
      res.floors = 'Поставьте минимум 1 этаж.';
      return res;
    }
    if (lower === 'height_m must be > 0') {
      res.height = minPositiveHint('Высота этажа');
      return res;
    }
    if (lower === 'outer_perimeter_m must be > 0' || lower === 'base_area_m2 must be > 0') {
      res.length = minPositiveHint('Длина');
      res.width = minPositiveHint('Ширина');
      return res;
    }
    if (lower === 'outer_wall_thickness_mm must be > 0') {
      res.outer_wall_mm = minPositiveHint('Внешняя стена');
      return res;
    }
    if (lower === 'inner_wall_thickness_mm must be > 0') {
      res.inner_wall_mm = minPositiveHint('Внутренняя стена');
      return res;
    }
    if (lower === 'inner_walls_length_m must be >= 0') {
      res.inner_walls = 'Количество внутренних перегородок не может быть отрицательным.';
      return res;
    }
    if (lower === 'overlap_thickness_mm must be > 0') {
      res.overlap_mm = minPositiveHint('Толщина перекрытия');
      return res;
    }
    if (lower === 'openings must have width_m>0 height_m>0 count>0') {
      res.windows = openingsHint;
      res.ext_doors = openingsHint;
      res.int_doors = openingsHint;
      return res;
    }

    if (lower === 'outer insulation thickness cannot exceed outer wall thickness') {
      res.outer_ins_id = `Утеплитель (${outerInsSelected}) слишком толстый для выбранной «Внешней стены». Выберите меньшую толщину.`;
      res.outer_wall_mm =
        outerInsMm != null
          ? `Утеплитель не должен быть толще «Внешней стены». Увеличьте «Внешняя стена» минимум до ${outerInsMm} мм (или выберите более тонкий утеплитель).`
          : 'Утеплитель не должен быть толще «Внешней стены». Увеличьте толщину стены или выберите более тонкий утеплитель.';
      return res;
    }
    if (lower === 'overlap insulation thickness cannot exceed overlap thickness') {
      res.outer_ins_id = `Утеплитель (${overlapInsSelected}) для перекрытий слишком толстый. Выберите меньшую толщину.`;
      res.overlap_mm =
        overlapInsMm != null
          ? `Утеплитель для перекрытий не должен быть толще «Толщина перекрытия». Увеличьте «Толщина перекрытия» минимум до ${overlapInsMm} мм (или выберите более тонкий утеплитель).`
          : 'Утеплитель для перекрытий не должен быть толще «Толщины перекрытия». Увеличьте толщину перекрытия или выберите более тонкий утеплитель.';
      return res;
    }

    // Catalog validation messages
    const fieldInvalid = normalized.match(/^([a-z_]+)\s+is invalid$/i);
    if (fieldInvalid) {
      const field = fieldInvalid[1];
      if (field === 'outer_osb_id' || field === 'inner_osb_id' || field === 'overlap_osb_id') {
        return {
          outer_osb_id: 'Раздел «Материалы» -> «ОСБ (внешние стены)»: выберите 9 мм или 12 мм.',
        };
      }
      if (field === 'outer_insulation_id' || field === 'overlap_insulation_id') {
        return {
          outer_ins_id: 'Раздел «Материалы» -> «Утеплитель»: выберите 50/100/150/200 мм.',
        };
      }
      // Для тех полей, которых нет в текущей форме — подсвечиваем блок материалов.
      return {
        materials_outer: 'Проверьте «Материалы»: сервер не нашёл/не поддерживает выбранный вариант (возможна проблема каталога).',
      };
    }

    const fieldType = normalized.match(/^([a-z_]+)\s+has invalid type$/i);
    if (fieldType) {
      const field = fieldType[1];
      if (field === 'outer_osb_id' || field === 'inner_osb_id' || field === 'overlap_osb_id') {
        return { outer_osb_id: 'Проверьте «ОСБ (внешние стены)»: выбранный вариант не соответствует типу OSB.' };
      }
      if (field === 'outer_insulation_id' || field === 'overlap_insulation_id') {
        return { outer_ins_id: 'Проверьте «Утеплитель»: выбранная толщину не соответствует типу утеплителя.' };
      }
      return { materials_outer: 'Проверьте «Материалы»: выбранный вариант не соответствует ожидаемому типу (возможна проблема каталога).' };
    }

    return res;
  };

  const translateFoundationError = (rawMsg: string) => {
    const normalized = rawMsg.trim().replace(/^(validation|not_found|forbidden|conflict|internal)\s*:\s*/i, '');
    const lower = normalized.toLowerCase();

    if (lower === 'invalid foundation input') {
      return 'Проверьте параметры фундамента: часть значений заполнена некорректно. Убедитесь, что все числовые поля больше 0.';
    }
    if (lower === 'outer_perimeter_m must be > 0') {
      return 'Внешний периметр должен быть больше 0.';
    }
    if (lower === 'inner_walls_length_m must be >= 0') {
      return 'Длина внутренних стен не может быть отрицательной.';
    }
    if (lower === 'formwork_board_thickness_m must be > 0') {
      return 'Толщина доски опалубки должна быть больше 0.';
    }
    if (lower === 'formwork_timber_length_m must be > 0') {
      return 'Длина бруса опалубки должна быть больше 0.';
    }
    if (lower === 'invalid pile_type_id' || lower === 'pile_type_id must reference pile item') {
      return 'Выбранный тип сваи не найден в каталоге. Выберите другой тип сваи.';
    }
    if (lower === 'invalid concrete_type_id' || lower === 'concrete_type_id must reference concrete item') {
      return 'Выбранная марка бетона не найдена в каталоге. Выберите другую марку бетона.';
    }

    return `Ошибка в параметрах фундамента: ${normalized}`;
  };

  const getFoundationFieldErrors = (rawMsg: string): Partial<Record<FoundationField, string>> => {
    const normalized = rawMsg.trim().replace(/^(validation|not_found|forbidden|conflict|internal)\s*:\s*/i, '');
    const lower = normalized.toLowerCase();

    const res: Partial<Record<FoundationField, string>> = {};

    if (lower === 'invalid foundation input') {
      res.outer_perimeter = 'Некорректное значение.';
      res.board_thickness = 'Некорректное значение.';
      res.timber_length = 'Некорректное значение.';
      return res;
    }
    if (lower === 'outer_perimeter_m must be > 0') {
      res.outer_perimeter = 'Значение должно быть больше 0.';
      return res;
    }
    if (lower === 'inner_walls_length_m must be >= 0') {
      res.inner_walls = 'Значение не может быть отрицательным.';
      return res;
    }
    if (lower === 'formwork_board_thickness_m must be > 0') {
      res.board_thickness = 'Значение должно быть больше 0.';
      return res;
    }
    if (lower === 'formwork_timber_length_m must be > 0') {
      res.timber_length = 'Значение должно быть больше 0.';
      return res;
    }
    if (lower === 'invalid pile_type_id' || lower === 'pile_type_id must reference pile item') {
      res.pile_type_id = 'Выбранный тип сваи не поддерживается. Выберите другой.';
      return res;
    }
    if (lower === 'invalid concrete_type_id' || lower === 'concrete_type_id must reference concrete item') {
      res.concrete_type_id = 'Выбранная марка бетона не поддерживается. Выберите другую.';
      return res;
    }

    return res;
  };

  const buildFrameInput = (): FrameInput => {
    const perimeter = (frameForm.length + frameForm.width) * 2;
    const area = frameForm.length * frameForm.width;

    // Бэкенд ожидает `int` для толщин и `int64` для количества проёмов.
    const outerWallThicknessMM = Math.round(frameForm.outer_wall_mm);
    const innerWallThicknessMM = Math.round(frameForm.inner_wall_mm);
    const overlapThicknessMM = Math.round(frameForm.overlap_mm);

    const externalDoorsCount = Math.floor(frameForm.ext_doors);
    const internalDoorsCount = Math.floor(frameForm.int_doors);
    const windowsCount = Math.floor(frameForm.windows);

    // Если пользователь поставил 0, не отправляем этот тип проёмов в расчёт
    // (иначе бэкенд ругается на count>0).
    const externalDoors = externalDoorsCount > 0
      ? [{ width_m: 1.0, height_m: 2.1, count: externalDoorsCount }]
      : [];
    const internalDoors = internalDoorsCount > 0
      ? [{ width_m: 0.9, height_m: 2.1, count: internalDoorsCount }]
      : [];
    const windows = windowsCount > 0
      ? [{ width_m: 1.2, height_m: 1.4, count: windowsCount }]
      : [];

    const floor = {
      height_m: frameForm.height,
      outer_perimeter_m: perimeter,
      base_area_m2: area,
      outer_wall_thickness_mm: outerWallThicknessMM,
      inner_walls_length_m: frameForm.inner_walls * frameForm.width,
      inner_wall_thickness_mm: innerWallThicknessMM,
    };
    return {
      floors: Array(Math.max(1, Math.floor(frameForm.floors))).fill(floor),
      external_doors: externalDoors,
      internal_doors: internalDoors,
      windows,
      outer_osb_id: frameForm.outer_osb_id,
      outer_vapor_barrier_id: frameForm.outer_vapor_id,
      outer_wind_protection_id: frameForm.outer_wind_id,
      outer_insulation_id: frameForm.outer_ins_id,
      inner_osb_id: frameForm.inner_osb_id,
      overlap_thickness_mm: overlapThicknessMM,
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
    setFrameErrors({});
    try {
      const input = calcType === 'frame' ? buildFrameInput() : buildFoundationInput();
      const order = await ordersApi.create(clientId, { calc_type: calcType, input });
      navigate(`/orders/${order.id}`);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Ошибка при расчёте';
      // На странице `new-order` для `frame` бэкенд шлёт короткие английские сообщения.
      // Делаем их русскими и привязанными к конкретным полям формы.
      if (calcType === 'frame') {
        setFrameErrors(getFrameFieldErrors(msg));
        setApiError(translateFrameError(msg));
      }
      else if (calcType === 'foundation') {
        setFoundErrors(getFoundationFieldErrors(msg));
        setApiError(translateFoundationError(msg));
      }
      else setApiError(msg);
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
          <div className="toast" style={{ borderLeftColor: 'var(--danger)', marginBottom: 16, whiteSpace: 'pre-line' }}>
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
              onClick={() => {
                setFrameErrors({});
                setFoundErrors({});
                setApiError(null);
                setCalcType('frame');
              }}
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
              onClick={() => {
                setFrameErrors({});
                setFoundErrors({});
                setApiError(null);
                setCalcType('foundation');
              }}
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
                  <InputUnit
                    label="Длина"
                    value={frameForm.length}
                    unit="м"
                    onChange={(v) => setFF('length', v)}
                    required
                    error={frameErrors.length ?? null}
                  />
                  <InputUnit
                    label="Ширина"
                    value={frameForm.width}
                    unit="м"
                    onChange={(v) => setFF('width', v)}
                    required
                    error={frameErrors.width ?? null}
                  />
                </div>
                <InputUnit
                  label="Высота этажа"
                  value={frameForm.height}
                  unit="м"
                  onChange={(v) => setFF('height', v)}
                  required
                  error={frameErrors.height ?? null}
                />
                <div className="form-group">
                  <label className="form-label">Количество этажей *</label>
                  <NumInput
                    value={frameForm.floors}
                    onChange={(v) => setFF('floors', Math.max(1, v))}
                    error={frameErrors.floors ?? null}
                  />
                </div>

                <div className="sec-subheading">Толщины стен</div>
                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <InputUnit
                    label="Внешняя стена"
                    value={frameForm.outer_wall_mm}
                    unit="мм"
                    onChange={(v) => setFF('outer_wall_mm', v)}
                    error={frameErrors.outer_wall_mm ?? null}
                  />
                  <InputUnit
                    label="Внутренняя стена"
                    value={frameForm.inner_wall_mm}
                    unit="мм"
                    onChange={(v) => setFF('inner_wall_mm', v)}
                    error={frameErrors.inner_wall_mm ?? null}
                  />
                </div>
                <InputUnit
                  label="Толщина перекрытия"
                  value={frameForm.overlap_mm}
                  unit="мм"
                  onChange={(v) => setFF('overlap_mm', v)}
                  error={frameErrors.overlap_mm ?? null}
                />
              </div>

              <div>
                <div className="sec-subheading">Стены и проёмы</div>
                <div className="form-group">
                  <label className="form-label">Внутренние перегородки</label>
                  <NumInput
                    value={frameForm.inner_walls}
                    onChange={(v) => setFF('inner_walls', Math.max(0, v))}
                    error={frameErrors.inner_walls ?? null}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Окна</label>
                    <NumInput
                      value={frameForm.windows}
                      onChange={(v) => setFF('windows', Math.max(0, v))}
                      error={frameErrors.windows ?? null}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Внешние двери</label>
                    <NumInput
                      value={frameForm.ext_doors}
                      onChange={(v) => setFF('ext_doors', Math.max(0, v))}
                      error={frameErrors.ext_doors ?? null}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Внутренние двери</label>
                  <NumInput
                    value={frameForm.int_doors}
                    onChange={(v) => setFF('int_doors', Math.max(0, v))}
                    error={frameErrors.int_doors ?? null}
                  />
                </div>

                <div className="sec-subheading">Материалы</div>
                <div className="form-group">
                  <label className="form-label">Утеплитель</label>
                  <div
                    className="tag-select"
                    style={frameErrors.outer_ins_id || frameErrors.materials_outer ? { border: '1px solid var(--danger)', borderRadius: 12, padding: 8 } : undefined}
                  >
                    {['insulation-50', 'insulation-100', 'insulation-150', 'insulation-200'].map((id) => (
                      <div
                        key={id}
                        className={`tag-option ${frameForm.outer_ins_id === id ? 'sel' : ''}`}
                        onClick={() => {
                          // Один выбор "Утеплителя" в UI применяем и к стенам, и к перекрытиям.
                          setFF('outer_ins_id', id);
                          setFF('overlap_ins_id', id);
                        }}
                      >
                        {id.replace('insulation-', '')} мм
                      </div>
                    ))}
                    {(frameErrors.outer_ins_id || (frameErrors.materials_outer && !frameErrors.outer_osb_id)) ? (
                      <div className="field-tip-wrap field-tip-wrap--tag">
                        <button
                          type="button"
                          className="field-tip-btn"
                          aria-label={frameErrors.outer_ins_id ?? frameErrors.materials_outer ?? ''}
                        >
                          !
                        </button>
                        <div className="field-tip-bubble">{frameErrors.outer_ins_id ?? frameErrors.materials_outer}</div>
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">ОСБ (внешние стены)</label>
                  <div
                    className="tag-select"
                    style={frameErrors.outer_osb_id || frameErrors.materials_outer ? { border: '1px solid var(--danger)', borderRadius: 12, padding: 8 } : undefined}
                  >
                    {['osb-9mm', 'osb-12mm'].map((id) => (
                      <div
                        key={id}
                        className={`tag-option ${frameForm.outer_osb_id === id ? 'sel' : ''}`}
                        onClick={() => {
                          // Один выбор ОСБ в UI применяем и для внутренних/перекрытий, чтобы ошибки были исправимыми прямо здесь.
                          setFF('outer_osb_id', id);
                          setFF('inner_osb_id', id);
                          setFF('overlap_osb_id', id);
                        }}
                      >
                        {id.replace('osb-', '')}
                      </div>
                    ))}
                    {(frameErrors.outer_osb_id || (frameErrors.materials_outer && !frameErrors.outer_ins_id)) ? (
                      <div className="field-tip-wrap field-tip-wrap--tag">
                        <button
                          type="button"
                          className="field-tip-btn"
                          aria-label={frameErrors.outer_osb_id ?? frameErrors.materials_outer ?? ''}
                        >
                          !
                        </button>
                        <div className="field-tip-bubble">{frameErrors.outer_osb_id ?? frameErrors.materials_outer}</div>
                      </div>
                    ) : null}
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
                <InputUnit label="Внешний периметр" value={foundForm.outer_perimeter} unit="м" onChange={(v) => setFnd('outer_perimeter', v)} required error={foundErrors.outer_perimeter ?? null} />
                <InputUnit label="Длина внутренних стен" value={foundForm.inner_walls} unit="м" onChange={(v) => setFnd('inner_walls', v)} error={foundErrors.inner_walls ?? null} />
                <InputUnit label="Толщина доски опалубки" value={foundForm.board_thickness} unit="м" onChange={(v) => setFnd('board_thickness', v)} required error={foundErrors.board_thickness ?? null} />
                <InputUnit label="Длина бруса опалубки" value={foundForm.timber_length} unit="м" onChange={(v) => setFnd('timber_length', v)} required error={foundErrors.timber_length ?? null} />
              </div>
              <div>
                <div className="sec-subheading">Тип сваи</div>
                <div className="tag-select" style={foundErrors.pile_type_id ? { border: '1px solid var(--danger)', borderRadius: 12, padding: 8 } : undefined}>
                  {['pile-p1', 'pile-p2'].map((id) => (
                    <div
                      key={id}
                      className={`tag-option ${foundForm.pile_type_id === id ? 'sel' : ''}`}
                      onClick={() => setFnd('pile_type_id', id)}
                    >
                      {id.replace('pile-', 'P').toUpperCase()}
                    </div>
                  ))}
                  {foundErrors.pile_type_id ? (
                    <div className="field-tip-wrap field-tip-wrap--tag">
                      <button type="button" className="field-tip-btn" aria-label={foundErrors.pile_type_id}>!</button>
                      <div className="field-tip-bubble">{foundErrors.pile_type_id}</div>
                    </div>
                  ) : null}
                </div>

                <div className="sec-subheading">Марка бетона</div>
                <div className="tag-select" style={foundErrors.concrete_type_id ? { border: '1px solid var(--danger)', borderRadius: 12, padding: 8 } : undefined}>
                  {['concrete-b20', 'concrete-b25'].map((id) => (
                    <div
                      key={id}
                      className={`tag-option ${foundForm.concrete_type_id === id ? 'sel' : ''}`}
                      onClick={() => setFnd('concrete_type_id', id)}
                    >
                      {id.replace('concrete-', '').toUpperCase()}
                    </div>
                  ))}
                  {foundErrors.concrete_type_id ? (
                    <div className="field-tip-wrap field-tip-wrap--tag">
                      <button type="button" className="field-tip-btn" aria-label={foundErrors.concrete_type_id}>!</button>
                      <div className="field-tip-bubble">{foundErrors.concrete_type_id}</div>
                    </div>
                  ) : null}
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
