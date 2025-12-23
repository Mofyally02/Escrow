/**
 * API Client Configuration
 * Axios instance with JWT interceptors and refresh token handling
 */
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Backend API base URL
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance with performance optimizations
export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  withCredentials: true, // Important for httpOnly cookies
  timeout: 10000, // 10 second timeout for better UX
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
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If 401 and we haven't retried yet, try to refresh token
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers && token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Get refresh token from localStorage
        let refreshToken: string | null = null;
        if (typeof window !== 'undefined') {
          refreshToken = localStorage.getItem('refresh_token');
        }

        if (!refreshToken) {
          // No refresh token available - clear tokens and redirect to login
          if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            // Redirect to login
            window.location.href = '/login';
          }
          isRefreshing = false;
          processQueue(new Error('No refresh token'), null);
          return Promise.reject(error);
        }

        // Attempt to refresh token
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/api/v1/auth/refresh`,
          { refresh_token: refreshToken },
          { withCredentials: true }
        );

        // Store new tokens
        const newAccessToken = refreshResponse.data?.access_token;
        const newRefreshToken = refreshResponse.data?.refresh_token;

        if (typeof window !== 'undefined') {
          if (newAccessToken) {
            localStorage.setItem('access_token', newAccessToken);
          }
          if (newRefreshToken) {
            localStorage.setItem('refresh_token', newRefreshToken);
          }
        }

        // Update Authorization header for retry
        if (newAccessToken && originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        // Process queued requests
        isRefreshing = false;
        processQueue(null, newAccessToken);

        // Retry original request
        return apiClient(originalRequest);
      } catch (refreshError: any) {
        // Refresh failed - clear tokens and redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          // Redirect to login
          window.location.href = '/login';
        }
        isRefreshing = false;
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      }
    }

    // For non-401 errors or if retry already attempted, reject with original error
    return Promise.reject(error);
  }
);

export default apiClient;
