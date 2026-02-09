'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

export default function SessionGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const hasRedirected = useRef(false);
  const lastPathname = useRef(pathname);

  // Reset redirect flag when pathname actually changes
  useEffect(() => {
    if (lastPathname.current !== pathname) {
      hasRedirected.current = false;
      lastPathname.current = pathname;
    }
  }, [pathname]);

  useEffect(() => {
    if (loading) {
      console.log('🔄 SessionGuard: Still loading...');
      return;
    }

    // Prevent multiple redirects
    if (hasRedirected.current) {
      console.log('⏭️ SessionGuard: Already redirected, skipping');
      return;
    }

    const publicPaths = ['/login', '/register', '/forgot-password', '/'];
    const isPublicPath = publicPaths.includes(pathname);

    console.log('SessionGuard Check:', {
      pathname,
      isPublicPath,
      hasUser: !!user,
      userRole: user?.role,
      loading,
    });

    // Redirect authenticated users away from auth pages (but not from home)
    if (user && isPublicPath && pathname !== '/') {
      console.log('User logged in on auth page, redirecting to dashboard');
      const dashboardPath = user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard';
      hasRedirected.current = true;
      router.push(dashboardPath);
      return;
    }

    // Redirect unauthenticated users away from protected pages
    if (!user && !isPublicPath) {
      console.log('Not authenticated, redirecting to home');
      hasRedirected.current = true;
      router.push('/');
      return;
    }

    console.log('Auth check passed for:', pathname);
  }, [user, loading, pathname]); // Removed 'router' from dependencies

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Loading session...</p>
        </div>
      </div>
    );
  }

  // Show loading state only for unauthenticated users on protected pages
  if (!user && pathname !== '/' && !pathname.startsWith('/login') && !pathname.startsWith('/register')) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Redirecting...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}