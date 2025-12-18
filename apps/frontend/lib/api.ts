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

// Request interceptor - attach JWT token from localStorage
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get access token from localStorage
    if (typeof window !== 'undefined') {
      const accessToken = localStorage.getItem('access_token');
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }
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
        // Get refresh token from localStorage or cookie
        let refreshToken: string | null = null;
        if (typeof window !== 'undefined') {
          // Try to get from localStorage first
          refreshToken = localStorage.getItem('refresh_token');
          
          // If not in localStorage, try to get from cookies
          if (!refreshToken) {
            const cookies = document.cookie.split(';');
            for (const cookie of cookies) {
              const [name, value] = cookie.trim().split('=');
              if (name === 'refresh_token') {
                refreshToken = decodeURIComponent(value);
                break;
              }
            }
          }
        }

        if (!refreshToken) {
          // No refresh token available - clear tokens and let client handle redirect
          if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            // Don't redirect here - let the component handle it
          }
          return Promise.reject(error);
        }

        // Attempt to refresh token
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/api/v1/auth/refresh`,
          { refresh_token: refreshToken },
          { withCredentials: true }
        );

        // Store new access token in localStorage
        if (refreshResponse.data?.access_token && typeof window !== 'undefined') {
          localStorage.setItem('access_token', refreshResponse.data.access_token);
        }
        if (refreshResponse.data?.refresh_token && typeof window !== 'undefined') {
          localStorage.setItem('refresh_token', refreshResponse.data.refresh_token);
        }

        // Retry original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - clear tokens and let client handle redirect
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          // Don't redirect here - let the component handle it
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
