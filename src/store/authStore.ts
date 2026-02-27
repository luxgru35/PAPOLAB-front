import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { loginRequest, registerRequest } from '../api/auth';
import type { AuthState, LoginRequest, RegisterRequest } from '../types/auth';

const APP_ID = Number(import.meta.env.VITE_APP_ID ?? 1);

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (data: LoginRequest) => {
        set({ isLoading: true, error: null });
        try {
          const { token } = await loginRequest({ ...data, app_id: APP_ID });
          localStorage.setItem('auth_token', token);
          set({ token, isAuthenticated: true, isLoading: false });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Неизвестная ошибка';
          set({ error: message, isLoading: false });
        }
      },

      register: async (data: RegisterRequest) => {
        set({ isLoading: true, error: null });
        try {
          // confirmPassword is frontend-only — strip before sending
          const { confirmPassword: _, ...body } = data;
          await registerRequest(body);
          set({ isLoading: false });
          return { success: true };
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Неизвестная ошибка';
          set({ error: message, isLoading: false });
        }
      },

      logout: () => {
        localStorage.removeItem('auth_token');
        set({ token: null, isAuthenticated: false, error: null });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);
