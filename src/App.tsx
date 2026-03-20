import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ClientsPage from './pages/ClientsPage';
import ClientCardPage from './pages/ClientCardPage';
import NewOrderPage from './pages/NewOrderPage';
import OrderPage from './pages/OrderPage';
import EditOrderPage from './pages/EditOrderPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Protected */}
        <Route path="/clients" element={<ProtectedRoute><ClientsPage /></ProtectedRoute>} />
        <Route path="/clients/:id" element={<ProtectedRoute><ClientCardPage /></ProtectedRoute>} />
        <Route path="/clients/:id/new-order" element={<ProtectedRoute><NewOrderPage /></ProtectedRoute>} />
        <Route path="/orders/:id" element={<ProtectedRoute><OrderPage /></ProtectedRoute>} />
        <Route path="/orders/:id/edit" element={<ProtectedRoute><EditOrderPage /></ProtectedRoute>} />

        {/* Redirects */}
        <Route path="/" element={<Navigate to="/clients" replace />} />
        <Route path="*" element={<Navigate to="/clients" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
