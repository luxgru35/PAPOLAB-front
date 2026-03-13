import axios from './axios';
import type { Client, ClientCard, CreateClientPayload } from '../types/client';

export const clientsApi = {
  list: () =>
    axios.get<{ clients: Client[] }>('/api/v1/clients').then((r) => r.data.clients),

  getCard: (id: string) =>
    axios.get<ClientCard>(`/api/v1/clients/${id}`).then((r) => r.data),

  create: (data: CreateClientPayload) =>
    axios.post<Client>('/api/v1/clients', data).then((r) => r.data),

  update: (id: string, data: Partial<CreateClientPayload>) =>
    axios.put<Client>(`/api/v1/clients/${id}`, data).then((r) => r.data),
};
