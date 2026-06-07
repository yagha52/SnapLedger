import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Use the computer's local IP address so physical phones can connect over Wi-Fi
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.101:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('snapledger_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authApi = {
  login: (data: any) => api.post('/auth/login', data),
  register: (data: any) => api.post('/auth/register', data),
};

export const invoicesApi = {
  getAll: () => api.get('/invoices'),
  scan: (formData: FormData) =>
    api.post('/invoices/scan', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  saveScanned: (data: any) => api.post('/invoices/save-scanned', data),
};

export default api;
