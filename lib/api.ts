import axios from 'axios';

export const BACKEND_URL = 'https://propalpha-backend-production.up.railway.app';

const api = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-App-Version': '1.1.9',
    'X-Client': 'web',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return config;
});

// A 401 on any call other than a sign-in means the token is gone or was displaced by a login on
// another device (the backend sends { sessionExpired: true } for that). Clear the session and send
// the user to the login gate; sign-in calls report their own errors.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (typeof window !== 'undefined' && err?.response?.status === 401) {
      const url: string = err.config?.url || '';
      const signingIn = /^\/auth\/(login|register|apple|google)/.test(url);
      if (!signingIn && !window.location.pathname.startsWith('/login')) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        const reason = err.response?.data?.sessionExpired ? 'session' : 'expired';
        const next = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/login?reason=${reason}&next=${next}`;
      }
    }
    return Promise.reject(err);
  },
);

export default api;
