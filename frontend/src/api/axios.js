import axios from 'axios';

// Prefer Electron-provided backend URL if available, fallback to VITE_API_URL, then local default
const electronBackendURL = typeof window !== 'undefined' && window.electron && window.electron.env
  ? window.electron.env.backendURL
  : undefined;

const baseURL = electronBackendURL || import.meta.env.VITE_API_URL || 'https://loan-management-application.onrender.com/api';
const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api; 