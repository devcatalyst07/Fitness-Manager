import { apiClient } from '@/lib/axios';

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
}

const authService = {
  async login(credentials: LoginCredentials): Promise<{ user: User; message: string }> {
    const response = await apiClient.post<{ user: User; message: string }>(
      '/api/auth/login',
      credentials
    );
    return response;
  },

  async register(data: RegisterData): Promise<{ user: User; message: string }> {
    const response = await apiClient.post<{ user: User; message: string }>(
      '/api/auth/register',
      data
    );
    return response;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/api/auth/logout');
      console.log('✅ Logout API call successful');
    } catch (error) {
      console.error('❌ Logout API call failed:', error);
    }
  },

  async logoutAll(): Promise<void> {
    await apiClient.post('/api/auth/logout-all');
  },

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<{ user: User }>('/api/auth/me');
    return response.user;
  },

  async checkAuth(): Promise<{ user: User } | null> {
    try {
      const response = await apiClient.get<{ user: User }>('/api/auth/me');
      return response;
    } catch (error: any) {
      if (error?.response?.status === 401) {
        return null;
      }
      throw error;
    }
  },

  async getMe(): Promise<{ user: User }> {
    const response = await apiClient.get<{ user: User }>('/api/auth/me');
    return response;
  },

  async refresh(): Promise<void> {
    await apiClient.post('/api/auth/refresh');
  },

  isAuthenticated(): boolean {
    return typeof window !== 'undefined' && 
           document.cookie.includes('fitout_session');
  },
};

export default authService;