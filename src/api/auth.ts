import axios, { AxiosError } from 'axios';
import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from '../types/auth';

const defaultBaseURL = import.meta.env.DEV ? '' : 'http://api-gateway-main:8080';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? defaultBaseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10_000,
});

// Attach JWT to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Helpers ───────────────────────────────────────────────────────────
function handleAxiosError(err: unknown): never {
  const error = err as AxiosError<{ message?: string }>;

  if (error.response) {
    const status = error.response.status;
    const message = error.response.data?.message;

    if (status === 401 || status === 403) {
      throw new Error('Неверный email или пароль');
    }
    if (status === 409) {
      throw new Error('Пользователь с таким email уже существует');
    }
    throw new Error(message ?? `Ошибка сервера (${status})`);
  }

  if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
    throw new Error('Сервер не отвечает. Проверьте соединение');
  }

  throw new Error('Не удалось подключиться к серверу');
}

// ── Login ─────────────────────────────────────────────────────────────
/**
 * POST /api/auth/login
 * API gateway: { email, password } → { access_token, refresh_token }
 */
export async function loginRequest(body: LoginRequest): Promise<LoginResponse> {
  try {
    const { data } = await api.post<LoginResponse>('/api/auth/login', body);
    return data;
  } catch (err) {
    handleAxiosError(err);
  }
}

// ── Register ──────────────────────────────────────────────────────────
/**
 * POST /api/auth/register
 * gRPC: Auth.Register(email, password) → user_id
 *
 * Backend returns user_id, NOT a token.
 * After successful registration, redirect to /login.
 */
export async function registerRequest(
  body: Omit<RegisterRequest, 'confirmPassword'>
): Promise<RegisterResponse> {
  try {
    const { data } = await api.post<RegisterResponse>('/api/auth/register', body);
    return data;
  } catch (err) {
    handleAxiosError(err);
  }
}

export default api;
