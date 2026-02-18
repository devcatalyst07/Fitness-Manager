'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import authService, { User } from '@/services/authService';
import { tokenRefreshService } from '@/services/tokenRefreshService';
import { sessionSync } from '@/lib/session';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  register: (name: string, email: string, password: string, role?: 'user' | 'admin') => Promise<void>;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Prevent duplicate session checks
  const hasCheckedSession = useRef(false);

  /**
   * Check existing session on mount — ONCE only
   *
   * KEY FIX: getCurrentUser() uses _skipAuthRefresh=true so if there's
   * no valid session, it just fails quietly. No refresh cascade.
   * No redirect here either — SessionGuard handles that.
   */
  useEffect(() => {
    if (hasCheckedSession.current) return;
    hasCheckedSession.current = true;

    const checkSession = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
        // Only start refresh service after confirming we have a valid session
        tokenRefreshService.start();
      } catch {
        // No valid session — that's fine. User will see login page.
        // NO redirect here. NO refresh attempt. Just set state.
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  /**
   * Handle session expiry events from axios interceptor
   *
   * KEY FIX: This ONLY clears state. It does NOT redirect.
   * SessionGuard will see user=null and handle the redirect.
   * This eliminates the competing redirect deadlock.
   */
  useEffect(() => {
    const handleSessionExpired = () => {
      // Already logged out — nothing to do
      if (!user) return;

      console.log('🔒 Session expired, clearing auth state');
      tokenRefreshService.stop();
      setUser(null);
      sessionSync.broadcastLogout();
      // NO router.replace() here! SessionGuard handles redirect.
    };

    window.addEventListener('session:expired', handleSessionExpired);
    return () => window.removeEventListener('session:expired', handleSessionExpired);
  }, [user]);

  /**
   * Cross-tab session sync
   */
  useEffect(() => {
    const handleSync = (event: string, data?: any) => {
      if (event === 'logout' && user) {
        tokenRefreshService.stop();
        setUser(null);
        // NO redirect — SessionGuard handles it
      } else if (event === 'login' && !user && data) {
        setUser(data);
        tokenRefreshService.start();
      }
    };

    const unsubscribe = sessionSync.addListener(handleSync);
    return () => unsubscribe();
  }, [user]);

  /**
   * Refresh token on tab re-focus (only if we have an active session)
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user && tokenRefreshService.isRunning()) {
        tokenRefreshService.refreshNow().catch(() => {
          // If refresh fails, the interceptor will handle it on next API call
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  /**
   * Login
   */
  const login = useCallback(async (email: string, password: string, rememberMe: boolean = false) => {
    const response = await authService.login({ email, password, rememberMe });
    setUser(response.user);
    tokenRefreshService.start();
    sessionSync.broadcastLogin(response.user);
  }, []);

  /**
   * Register
   */
  const register = useCallback(async (name: string, email: string, password: string, role: 'user' | 'admin' = 'user') => {
    const response = await authService.register({ name, email, password, role });
    setUser(response.user);
    tokenRefreshService.start();
    sessionSync.broadcastLogin(response.user);
  }, []);

  /**
   * Logout — intentional user action
   */
  const logout = useCallback(async () => {
    tokenRefreshService.stop();

    try {
      await authService.logout();
    } catch {
      // Ignore logout API errors
    }

    setUser(null);
    sessionSync.broadcastLogout();
    // NO redirect — SessionGuard handles it
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        register,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};