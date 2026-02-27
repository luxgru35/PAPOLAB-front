// ── Login ────────────────────────────────────────
export interface LoginRequest {
  email: string;
  password: string;
  app_id: number; // Required by backend — set via VITE_APP_ID env var
}

export interface LoginResponse {
  token: string;
}

// ── Register ─────────────────────────────────────
export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string; // Frontend-only validation, not sent to backend
}

export interface RegisterResponse {
  user_id: number;
}

// ── Zustand store ─────────────────────────────────
export interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<{ success: true } | void>;
  logout: () => void;
  clearError: () => void;
}
