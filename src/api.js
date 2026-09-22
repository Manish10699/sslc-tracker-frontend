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

export async function savePushSubscription(subscription, accessToken) {
  const API_BASE = import.meta.env.DEV
    ? 'http://127.0.0.1:8000/api'
    : 'https://sslc-tracker.onrender.com/api';

  const subscriptionJson = subscription.toJSON();

  const payload = {
    endpoint: subscriptionJson.endpoint,
    p256dh: subscriptionJson.keys.p256dh,
    auth: subscriptionJson.keys.auth,
  };

  const response = await fetch(
    `${API_BASE}/push-subscription/`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Push subscription API error:', errorData);
    throw new Error('Failed to save push subscription');
  }

  return response.json();
}