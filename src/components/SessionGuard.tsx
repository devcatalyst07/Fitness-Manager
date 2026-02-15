'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const PUBLIC_PATHS = ['/login', '/register', '/forgot-password', '/'];

/**
 * SessionGuard — SOLE OWNER of auth-based redirects
 *
 * AuthContext NEVER redirects. Only SessionGuard does.
 * This eliminates competing redirect deadlocks.
 *
 * Logic:
 * - While loading → show spinner
 * - No user + protected page → redirect to /
 * - User + auth page → redirect to dashboard
 * - Otherwise → render children
 */
export default function SessionGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const redirectingTo = useRef<string | null>(null);

  // Track whether we should show content
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Still checking auth — wait
    if (loading) {
      setShowContent(false);
      return;
    }

    const isPublicPath = PUBLIC_PATHS.includes(pathname);

    // Case 1: No user on a protected route → send to login
    if (!user && !isPublicPath) {
      // Prevent duplicate redirects to same destination
      if (redirectingTo.current !== '/') {
        redirectingTo.current = '/';
        console.log('No session, redirecting to /');
        router.replace('/');
      }
      setShowContent(false);
      return;
    }

    // Case 2: Logged-in user on an auth page (login/register) → send to dashboard
    if (user && isPublicPath && pathname !== '/') {
      const dest = user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard';
      if (redirectingTo.current !== dest) {
        redirectingTo.current = dest;
        console.log('Authenticated, redirecting to', dest);
        router.replace(dest);
      }
      setShowContent(false);
      return;
    }

    // Case 3: Valid state — show the page content
    redirectingTo.current = null;
    setShowContent(true);
  }, [user, loading, pathname, router]);

  // Show loading spinner while checking auth or redirecting
  if (loading || !showContent) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            {loading ? 'Loading...' : 'Redirecting...'}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}