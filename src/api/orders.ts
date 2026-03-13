import axios from './axios';
import type { Order, CreateOrderPayload } from '../types/order';

export const ordersApi = {
  create: (clientId: string, data: CreateOrderPayload) =>
    axios
      .post<Order>(`/api/v1/clients/${clientId}/orders`, data)
      .then((r) => r.data),

  get: (orderId: string) =>
    axios.get<Order>(`/api/v1/orders/${orderId}`).then((r) => r.data),

  recalc: (orderId: string, input: unknown) =>
    axios
      .put<Order>(`/api/v1/orders/${orderId}/recalc`, { input })
      .then((r) => r.data),

  updateStatus: (orderId: string, status: string) =>
    axios
      .patch<Order>(`/api/v1/orders/${orderId}/status`, { status })
      .then((r) => r.data),
};
