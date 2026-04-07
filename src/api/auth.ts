import axios, { AxiosError } from 'axios';
import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from '../types/auth';

const configuredBaseURL = String(import.meta.env.VITE_API_URL ?? '').trim();

const api = axios.create({
  baseURL: configuredBaseURL || '',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10_000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

function handleAxiosError(err: unknown): never {
  const error = err as AxiosError<{ message?: string }>;

  if (error.response) {
    const status = error.response.status;
    const message = error.response.data?.message;

    if (status === 401 || status === 403) {
      throw new Error('Invalid email or password');
    }
    if (status === 409) {
      throw new Error('User with this email already exists');
    }
    throw new Error(message ?? `Server error (${status})`);
  }

  if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
    throw new Error('Server is not responding. Check your connection');
  }

  throw new Error('Could not connect to server');
}

export async function loginRequest(body: LoginRequest): Promise<LoginResponse> {
  try {
    const { data } = await api.post<LoginResponse>('/api/auth/login', body);
    return data;
  } catch (err) {
    handleAxiosError(err);
  }
}

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
