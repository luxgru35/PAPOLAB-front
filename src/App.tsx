import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import { useAuthStore } from './store/authStore';

// Simple protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

// Placeholder dashboard — replace with your actual component
function Dashboard() {
  const logout = useAuthStore((s) => s.logout);
  return (
    <div style={{ padding: 40, fontFamily: 'Geologica, sans-serif', color: '#edf0f7', background: '#08090d', minHeight: '100vh' }}>
      <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 32, color: '#e8a34a' }}>Dashboard</h1>
      <button onClick={logout} style={{ marginTop: 16, padding: '8px 18px', background: '#2a3347', color: '#edf0f7', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
        Выйти
      </button>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
