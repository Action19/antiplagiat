import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://antiplagiat-hhlu.onrender.com/api';

const api = axios.create({ baseURL: API_URL, headers: { 'Content-Type': 'application/json' } });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use((r) => r, (error) => {
  if (error.response?.status === 401) { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href = '/login'; }
  return Promise.reject(error);
});

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me')
};

export const documentsAPI = {
  upload: (formData) => api.post('/documents/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  checkText: (data) => api.post('/documents/check-text', data),
  getAll: (page = 1, limit = 10) => api.get(`/documents?page=${page}&limit=${limit}`),
  getOne: (id) => api.get(`/documents/${id}`),
  getResults: (id) => api.get(`/documents/${id}/results`),
  getReport: (id) => api.get(`/documents/${id}/report`, { responseType: 'blob' }),
  delete: (id) => api.delete(`/documents/${id}`)
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: () => api.get('/admin/users'),
  toggleUser: (id) => api.put(`/admin/users/${id}/toggle`),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getDocuments: () => api.get('/admin/documents')
};

export default api;
