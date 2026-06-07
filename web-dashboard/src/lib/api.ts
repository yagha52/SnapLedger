import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('snapledger_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('snapledger_token');
      localStorage.removeItem('snapledger_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authApi = {
  register: (data: { fullName: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  google: (idToken: string) =>
    api.post('/auth/google', { idToken }),
};

// Invoices
export const invoicesApi = {
  getAll: (params?: { category?: string; search?: string }) =>
    api.get('/invoices', { params }),
  getById: (id: number) => api.get(`/invoices/${id}`),
  scan: (formData: FormData) =>
    api.post('/invoices/scan', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  saveScanned: (data: object) => api.post('/invoices/save-scanned', data),
  create: (data: object) => api.post('/invoices', data),
  update: (id: number, data: object) => api.put(`/invoices/${id}`, data),
  delete: (id: number) => api.delete(`/invoices/${id}`),
  analytics: () => api.get('/invoices/analytics'),
};

export default api;
