import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../lib/constants';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Inject auth token or client headers if available
    const apiKey = localStorage.getItem('nexguard_api_key');
    if (apiKey && config.headers) {
      config.headers['Authorization'] = `Bearer ${apiKey}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    let message = 'An unexpected error occurred';
    if (error.response?.data && typeof error.response.data === 'object' && 'message' in error.response.data) {
      message = String((error.response.data as { message: unknown }).message);
    } else if (error.message) {
      message = error.message;
    }
    console.warn(`[NexGuard API Warning]: ${message} (${error.config?.url})`);
    return Promise.reject(error);
  }
);

export default apiClient;
