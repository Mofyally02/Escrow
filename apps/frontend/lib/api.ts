/**
 * API Client Configuration
 * Axios instance with JWT interceptors and refresh token handling
 */
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Backend API base URL
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance
export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  withCredentials: true, // Important for httpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach JWT token from cookie
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // JWT token is stored in httpOnly cookie, so it's automatically sent
    // No need to manually attach it here
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle token refresh
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If 401 and we haven't retried yet, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh token
        await axios.post(
          `${API_BASE_URL}/api/v1/auth/refresh`,
          {},
          { withCredentials: true }
        );

        // Retry original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
