import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api`;

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dinedrop_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    const status = error.response?.status;

    if (status === 401) {
      localStorage.removeItem('dinedrop_token');
      localStorage.removeItem('dinedrop_user');
      if (window.location.pathname !== '/login') {
        toast.error('Session expired. Please login again.');
        window.location.href = '/login';
      }
    } else if (status === 403) {
      toast.error('You do not have permission for this action');
    } else if (status === 404) {
      toast.error('Resource not found');
    } else if (status && status >= 400 && status < 500) {
      toast.error(message);
    } else if (status && status >= 500) {
      toast.error('Server error. Please try again later.');
    }

    return Promise.reject(error);
  }
);

export default api;
