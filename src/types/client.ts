export interface Client {
  id: string;
  last_name: string;
  first_name: string;
  middle_name: string;
  email: string;
  phone: string;
  created_at: string;
  updated_at: string;
}

export interface ClientCard {
  client: Client;
  orders: OrderSummary[];
}

export interface OrderSummary {
  id: string;
  status: OrderStatus;
  calc_type: CalcType;
  created_at: string;
}

export type OrderStatus = 'accepted' | 'in_progress' | 'delivered';
export type CalcType = 'foundation' | 'frame';

export interface CreateClientPayload {
  last_name: string;
  first_name: string;
  middle_name: string;
  email: string;
  phone: string;
}

// UI helper
export function clientFullName(c: Client): string {
  return [c.last_name, c.first_name, c.middle_name].filter(Boolean).join(' ');
}

export function clientInitials(c: Client): string {
  return [(c.last_name[0] ?? ''), (c.first_name[0] ?? '')].join('').toUpperCase();
}
