import api, { apiClient } from '@/lib/axios';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  roleId?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: 'user' | 'admin';
}

const authService = {
  /**
   * Login — normal request, cookies will be set by backend
   */
  async login(credentials: LoginCredentials): Promise<{ user: User; message: string }> {
    return apiClient.post<{ user: User; message: string }>(
      '/api/auth/login',
      credentials
    );
  },

  /**
   * Register — normal request
   */
  async register(data: RegisterData): Promise<{ user: User; message: string }> {
    return apiClient.post<{ user: User; message: string }>(
      '/api/auth/register',
      data
    );
  },

  /**
   * Logout
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/api/auth/logout');
    } catch {
      // Ignore — user is leaving anyway
    }
  },

  /**
   * Get current user — INITIAL SESSION CHECK
   *
   * KEY FIX: Uses _skipAuthRefresh = true
   *
   * On initial page load, we check if there's a valid session cookie.
   * If the cookie is expired/missing, we get 401. In that case we should
   * just return null — NOT try to refresh (there's nothing to refresh).
   *
   * Token refresh only makes sense AFTER the user has logged in and their
   * access token expires mid-session.
   */
  async getCurrentUser(): Promise<User> {
    const response = await api.get('/api/auth/me', {
      _skipAuthRefresh: true, // Don't trigger refresh cascade on initial check
    } as any);
    return response.data.user;
  },

  /**
   * Refresh token — explicit call
   */
  async refresh(): Promise<void> {
    await apiClient.post('/api/auth/refresh');
  },
};

export default authService;