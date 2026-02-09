import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000'),
  withCredentials: true, // CRITICAL: Send cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// CSRF token storage
let csrfToken: string | null = null;

/**
 * Set CSRF token
 */
export const setCsrfToken = (token: string) => {
  csrfToken = token;
};

/**
 * Get CSRF token
 */
export const getCsrfToken = (): string | null => {
  return csrfToken;
};

/**
 * Request interceptor - Add CSRF token to requests
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add CSRF token to state-changing requests
    if (
      csrfToken &&
      ['post', 'put', 'delete', 'patch'].includes(config.method?.toLowerCase() || '')
    ) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - Handle token refresh
 */
api.interceptors.response.use(
  (response) => {
    // Extract CSRF token from response headers
    const newCsrfToken = response.headers['x-csrf-token'];
    if (newCsrfToken) {
      setCsrfToken(newCsrfToken);
    }

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Handle 401 Unauthorized - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      const errorData = error.response.data as any;

      // If token expired, try to refresh
      if (errorData?.code === 'AUTH_TOKEN_EXPIRED') {
        originalRequest._retry = true;

        try {
          // Call refresh endpoint
          await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`,
            {},
            {
              withCredentials: true,
            }
          );

          // Retry original request
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed - redirect to login
          console.error('Token refresh failed:', refreshError);
          
          // Emit custom event for session expiry
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('session:expired'));
          }

          return Promise.reject(refreshError);
        }
      }

      // Session expired or invalid - redirect to login
      if (
        errorData?.code === 'SESSION_EXPIRED' ||
        errorData?.code === 'SESSION_REVOKED' ||
        errorData?.code === 'SESSION_HIJACK_DETECTED'
      ) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('session:expired', {
              detail: { reason: errorData.code },
            })
          );
        }
      }
    }

    return Promise.reject(error);
  }
);

/**
 * API helper methods
 */
export const apiClient = {
  get: <T = any>(url: string, config = {}) => 
    api.get<T>(url, config).then((res) => res.data),
  
  post: <T = any>(url: string, data?: any, config = {}) =>
    api.post<T>(url, data, config).then((res) => res.data),
  
  put: <T = any>(url: string, data?: any, config = {}) =>
    api.put<T>(url, data, config).then((res) => res.data),
  
  delete: <T = any>(url: string, config = {}) =>
    api.delete<T>(url, config).then((res) => res.data),
  
  patch: <T = any>(url: string, data?: any, config = {}) =>
    api.patch<T>(url, data, config).then((res) => res.data),
};

export default api;