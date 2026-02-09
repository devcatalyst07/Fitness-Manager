import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';

/**
 * Custom hook to access auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

/**
 * Hook to check if user has specific role
 */
export function useRole(requiredRole: 'user' | 'admin') {
  const { user } = useAuth();
  return user?.role === requiredRole;
}

/**
 * Hook to check if user is admin
 */
export function useIsAdmin() {
  return useRole('admin');
}

/**
 * Hook to check if user is regular user
 */
export function useIsUser() {
  return useRole('user');
}