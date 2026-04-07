import axios from 'axios';

const configuredBaseURL = String(import.meta.env.VITE_API_URL ?? '').trim();
const isHttpsPage = typeof window !== 'undefined' && window.location.protocol === 'https:';
const resolvedBaseURL =
  isHttpsPage && configuredBaseURL.startsWith('http://') ? '' : configuredBaseURL;

const instance = axios.create({
  baseURL: resolvedBaseURL || '',
});

instance.interceptors.request.use((config) => {
  const raw = localStorage.getItem('auth-storage');
  if (raw) {
    try {
      const { state } = JSON.parse(raw);
      if (state?.token) {
        config.headers.Authorization = `Bearer ${state.token}`;
      }
    } catch {
      // ignore
    }
  }
  return config;
});

instance.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default instance;

