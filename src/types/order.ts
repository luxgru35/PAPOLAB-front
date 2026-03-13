import type { CalcType, OrderStatus } from './client';

export type { CalcType, OrderStatus };

export interface PriceLine {
  key: string;
  name: string;
  unit: string;
  quantity: number;
  unit_price_minor: number;
  total_minor: number;
}

export interface PriceSnapshot {
  lines: PriceLine[];
  missing_price_keys: string[];
  total_minor: number;
}

export interface Order {
  id: string;
  client_id: string;
  status: OrderStatus;
  calc_type: CalcType;
  calc_version: number;
  input: unknown;
  result: unknown;
  price_snapshot: PriceSnapshot;
  total_cost_minor: number;
  created_at: string;
  updated_at: string;
}

export interface CreateOrderPayload {
  calc_type: CalcType;
  input: unknown;
}

export interface FrameInput {
  floors: FloorInput[];
  external_doors: Opening[];
  internal_doors: Opening[];
  windows: Opening[];
  outer_osb_id: string;
  outer_vapor_barrier_id: string;
  outer_wind_protection_id: string;
  outer_insulation_id: string;
  inner_osb_id: string;
  overlap_thickness_mm: number;
  overlap_osb_id: string;
  overlap_vapor_barrier_id: string;
  overlap_wind_protection_id: string;
  overlap_insulation_id: string;
}

export interface FloorInput {
  height_m: number;
  outer_perimeter_m: number;
  base_area_m2: number;
  outer_wall_thickness_mm: number;
  inner_walls_length_m: number;
  inner_wall_thickness_mm: number;
}

export interface Opening {
  width_m: number;
  height_m: number;
  count: number;
}

export interface FoundationInput {
  outer_perimeter_m: number;
  inner_walls_length_m: number;
  pile_type_id: string;
  concrete_type_id: string;
  formwork_board_thickness_m: number;
  formwork_timber_length_m: number;
}

// Formatters
export function formatMinor(minor: number): string {
  return new Intl.NumberFormat('ru-RU').format(Math.round(minor / 100)) + ' ₽';
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  accepted: 'Актуален',
  in_progress: 'В работе',
  delivered: 'Договор',
};

export const CALC_TYPE_LABELS: Record<CalcType, { label: string; icon: string }> = {
  frame: { label: 'Каркас и перекрытия', icon: '🏗️' },
  foundation: { label: 'Фундамент', icon: '🔩' },
};
