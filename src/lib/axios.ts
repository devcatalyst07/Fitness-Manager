import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

// Create axios instance — ALL API calls should use this
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
  timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || "30000"),
  withCredentials: true, // CRITICAL: Send cookies with every request
  headers: {
    "Content-Type": "application/json",
  },
});

// CSRF token storage
let csrfToken: string | null = null;

// ============================================
// SINGLE REFRESH MECHANISM — No duplicates
// ============================================
let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: any = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve();
    }
  });
  failedQueue = [];
};

/**
 * Perform token refresh — SINGLE ENTRY POINT
 * Returns a shared promise so concurrent callers wait for the same refresh
 */
const performRefresh = async (): Promise<void> => {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;

  refreshPromise = (async () => {
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/refresh`,
        {},
        {
          withCredentials: true,
          timeout: 10000,
        },
      );
      console.log("Token refreshed successfully");
      processQueue(null);
    } catch (error) {
      console.error("Token refresh failed");
      processQueue(error);
      throw error;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

// ============================================
// CSRF helpers
// ============================================
export const setCsrfToken = (token: string) => {
  csrfToken = token;
};

export const getCsrfToken = (): string | null => {
  return csrfToken;
};

// ============================================
// REQUEST INTERCEPTOR
// ============================================
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (
      csrfToken &&
      ["post", "put", "delete", "patch"].includes(
        config.method?.toLowerCase() || "",
      )
    ) {
      config.headers["X-CSRF-Token"] = csrfToken;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

// ============================================
// RESPONSE INTERCEPTOR
// ============================================
api.interceptors.response.use(
  (response) => {
    const newCsrfToken = response.headers["x-csrf-token"];
    if (newCsrfToken) {
      setCsrfToken(newCsrfToken);
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
      _retryCount?: number;
      _skipAuthRefresh?: boolean;
    };

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const status = error.response?.status;

    // ================================================
    // HANDLE 429 — Rate Limited
    // ================================================
    // THIS IS THE KEY FIX for the "data disappears" bug.
    //
    // When rate limited, the old code just rejected the promise.
    // React Query / components treated this as a fatal error.
    // If /api/auth/me was rate limited, the app thought the
    // session was dead → auto-logout → all data cleared.
    //
    // NEW BEHAVIOR: Wait for the Retry-After period, then retry
    // the request ONCE. This makes rate limiting transparent
    // to the rest of the app — the request just takes longer.
    // ================================================
    if (status === 429) {
      const retryCount = originalRequest._retryCount || 0;

      // Only retry once for rate limits — don't loop
      if (retryCount < 1) {
        originalRequest._retryCount = retryCount + 1;

        // Read Retry-After header from backend (in seconds)
        // Default to 5 seconds if not present
        const retryAfterHeader = error.response?.headers?.["retry-after"];
        const retryAfterMs = retryAfterHeader
          ? parseInt(retryAfterHeader) * 1000
          : 5000;

        // Cap at 30 seconds to avoid very long waits
        const waitMs = Math.min(retryAfterMs, 30000);

        console.warn(
          `Rate limited on ${originalRequest.url}, retrying in ${waitMs / 1000}s`,
        );

        // Wait, then retry
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        return api(originalRequest);
      }

      // Already retried once — give up, but DON'T treat as auth failure
      console.error(`Rate limit retry exhausted for ${originalRequest.url}`);
      return Promise.reject(error);
    }

    // ================================================
    // HANDLE 401 — Unauthorized
    // ================================================
    if (status !== 401) {
      return Promise.reject(error);
    }

    // If request opted out of auto-refresh (initial session check)
    if (originalRequest._skipAuthRefresh) {
      return Promise.reject(error);
    }

    const errorData = error.response?.data as any;

    // Don't retry auth endpoints — prevents infinite loops
    const authEndpoints = [
      "/api/auth/login",
      "/api/auth/register",
      "/api/auth/refresh",
      "/api/auth/logout",
    ];
    if (authEndpoints.some((ep) => originalRequest.url?.includes(ep))) {
      return Promise.reject(error);
    }

    // Already retried — give up
    if (originalRequest._retry) {
      emitSessionExpired(errorData?.code || "RETRY_EXHAUSTED");
      return Promise.reject(error);
    }

    // Token expired or invalid — try refresh
    if (
      errorData?.code === "AUTH_TOKEN_EXPIRED" ||
      errorData?.code === "AUTH_TOKEN_INVALID" ||
      errorData?.code === "AUTH_TOKEN_MISSING"
    ) {
      originalRequest._retry = true;

      try {
        await performRefresh();
        return api(originalRequest);
      } catch (refreshError) {
        emitSessionExpired("REFRESH_FAILED");
        return Promise.reject(refreshError);
      }
    }

    // Session revoked/hijacked — no recovery
    if (
      errorData?.code === "SESSION_EXPIRED" ||
      errorData?.code === "SESSION_REVOKED" ||
      errorData?.code === "SESSION_HIJACK_DETECTED" ||
      errorData?.code === "USER_NOT_FOUND" ||
      errorData?.code === "ROLE_REVOKED"
    ) {
      emitSessionExpired(errorData.code);
    }

    return Promise.reject(error);
  },
);

/**
 * Emit session expired event — ONCE only per cycle
 */
let hasEmittedExpiry = false;
const emitSessionExpired = (reason: string) => {
  if (hasEmittedExpiry) return;
  hasEmittedExpiry = true;

  console.log("Session expired:", reason);

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("session:expired", { detail: { reason } }),
    );
  }

  setTimeout(() => {
    hasEmittedExpiry = false;
  }, 5000);
};

// ============================================
// PUBLIC API
// ============================================
export const apiClient = {
  get: <T = any>(url: string, config: any = {}) =>
    api.get<T>(url, config).then((res) => res.data),

  post: <T = any>(url: string, data?: any, config: any = {}) =>
    api.post<T>(url, data, config).then((res) => res.data),

  put: <T = any>(url: string, data?: any, config: any = {}) =>
    api.put<T>(url, data, config).then((res) => res.data),

  delete: <T = any>(url: string, config: any = {}) =>
    api.delete<T>(url, config).then((res) => res.data),

  patch: <T = any>(url: string, data?: any, config: any = {}) =>
    api.patch<T>(url, data, config).then((res) => res.data),
};

export const refreshTokens = performRefresh;
export const isRefreshInProgress = (): boolean => isRefreshing;

export default api;
