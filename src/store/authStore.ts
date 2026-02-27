import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { loginRequest } from '../api/auth';
import type { AuthState, LoginRequest } from '../types/auth';

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
          const { token } = await loginRequest(data);
          localStorage.setItem('auth_token', token);
          set({ token, isAuthenticated: true, isLoading: false });
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
