import axios, { AxiosError } from 'axios';
import type { LoginRequest, LoginResponse } from '../types/auth';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:4055',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10_000,
});

// Attach JWT to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Auth ──────────────────────────────────────────────────────────────
/**
 * POST /v1/auth/login
 * Backend: gRPC Auth.Login via REST gateway
 * Request:  { login, password }
 * Response: { token }
 */
export async function loginRequest(body: LoginRequest): Promise<LoginResponse> {
  try {
    const { data } = await api.post<LoginResponse>('/v1/auth/login', body);
    return data;
  } catch (err) {
    const error = err as AxiosError<{ message?: string }>;

    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message;

      if (status === 401 || status === 403) {
        throw new Error('Неверный логин или пароль');
      }
      throw new Error(message ?? `Ошибка сервера (${status})`);
    }

    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      throw new Error('Сервер не отвечает. Проверьте соединение');
    }

    throw new Error('Не удалось подключиться к серверу');
  }
}

export default api;
