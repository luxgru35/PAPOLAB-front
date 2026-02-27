import axios, { AxiosError } from 'axios';
import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from '../types/auth';

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
 * POST /v1/auth/login
 * gRPC: Auth.Login(email, password, app_id) → token
 *
 * app_id is required by the backend — configure via VITE_APP_ID env var.
 */
export async function loginRequest(body: LoginRequest): Promise<LoginResponse> {
  try {
    const { data } = await api.post<LoginResponse>('/v1/auth/login', body);
    return data;
  } catch (err) {
    handleAxiosError(err);
  }
}

// ── Register ──────────────────────────────────────────────────────────
/**
 * POST /v1/auth/register
 * gRPC: Auth.Register(email, password) → user_id
 *
 * Backend returns user_id, NOT a token.
 * After successful registration, redirect to /login.
 */
export async function registerRequest(
  body: Omit<RegisterRequest, 'confirmPassword'>
): Promise<RegisterResponse> {
  try {
    const { data } = await api.post<RegisterResponse>('/v1/auth/register', body);
    return data;
  } catch (err) {
    handleAxiosError(err);
  }
}

export default api;
