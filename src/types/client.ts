export type ClientStatus = 'active' | 'contract' | 'inactive' | 'new';

export interface Client {
  id: number;
  lastName: string;
  firstName: string;
  patronymic?: string;
  email?: string;
  phone: string;
  calculationsCount: number;
  status: ClientStatus;
  createdAt: string; // ISO date string
}
