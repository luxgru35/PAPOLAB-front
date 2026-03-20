// ── Login ────────────────────────────────────────
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  manager_name?: string;
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
  displayName: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<{ success: true } | void>;
  logout: () => void;
  clearError: () => void;
}
