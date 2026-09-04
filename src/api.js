import axios from 'axios';
import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from './auth';

const api = axios.create({
  baseURL: import.meta.env.DEV ? 'http://127.0.0.1:8000/api': 'https://sslc-tracker.onrender.com/api',
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = getRefreshToken();
        const response = await axios.post('https://sslc-tracker.onrender.com/api/token/refresh/', {
          refresh: refreshToken,
        });
        saveTokens(response.data.access, refreshToken);
        originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
        return api(originalRequest);
      } catch (refreshError) {
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;