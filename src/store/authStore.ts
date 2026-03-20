import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { loginRequest, registerRequest } from '../api/auth';
import type { AuthState, LoginRequest, RegisterRequest } from '../types/auth';

function displayNameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? '';
  if (!local) return 'Менеджер';
  const name = local.replace(/[._-]+/g, ' ').trim();
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      displayName: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (data: LoginRequest) => {
        set({ isLoading: true, error: null });
        try {
          const { access_token, manager_name } = await loginRequest(data);
          localStorage.setItem('auth_token', access_token);
          set({
            token: access_token,
            displayName: manager_name?.trim() || displayNameFromEmail(data.email),
            isAuthenticated: true,
            isLoading: false,
          });
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
        set({ token: null, displayName: null, isAuthenticated: false, error: null });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        displayName: state.displayName,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
