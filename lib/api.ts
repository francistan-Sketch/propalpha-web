import axios from 'axios';

const api = axios.create({
  baseURL: 'https://propalpha-backend-production.up.railway.app',
  headers: {
    'Content-Type': 'application/json',
    'X-App-Version': '1.0.7',
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

export default api;
