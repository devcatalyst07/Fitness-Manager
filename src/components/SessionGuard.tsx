"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { apiClient } from "@/lib/axios";
import { hasPermission } from "@/utils/permissions";

const PUBLIC_PATHS = ["/login", "/register", "/forgot-password", "/"];

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
export default function SessionGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const redirectingTo = useRef<string | null>(null);
  const [landingLoading, setLandingLoading] = useState(false);

  // Track whether we should show content
  const [showContent, setShowContent] = useState(false);
  const [sessionExpiredReason, setSessionExpiredReason] = useState<
    string | null
  >(null);

  /**
   * Listen for session expiry with reason (e.g., ROLE_REVOKED)
   */
  useEffect(() => {
    const handleSessionExpired = (event: Event) => {
      const customEvent = event as CustomEvent;
      const reason = customEvent.detail?.reason;
      console.log(`🔒 Session expired [${reason}]`);
      setSessionExpiredReason(reason);
    };

    window.addEventListener("session:expired", handleSessionExpired);
    return () =>
      window.removeEventListener("session:expired", handleSessionExpired);
  }, []);

  /**
   * Clear session expired reason when user changes (e.g., on logout)
   * This prevents showing expired message after logout
   */
  useEffect(() => {
    if (!user) {
      setSessionExpiredReason(null);
    }
  }, [user]);

  /**
   * Handle logout/session expiry redirects quickly
   * Don't rely on async operations that could delay redirect
   */
  useEffect(() => {
    if (loading) return; // Still checking auth

    const isPublicPath = PUBLIC_PATHS.includes(pathname);

    // Quick redirect: No user on protected route → immediately redirect to /
    if (!user && !isPublicPath) {
      console.log("📍 User logged out or session expired, redirecting to home");
      router.replace("/");
      return;
    }
  }, [user, loading, pathname, router]);

  useEffect(() => {
    // Still checking auth — wait
    if (loading) {
      setShowContent(false);
      return;
    }

    const isPublicPath = PUBLIC_PATHS.includes(pathname);

    // Quick redirect already handled above for !user case
    // This useEffect now only focuses on setting showContent correctly

    // Case 1: No user on protected route — already redirecting above, just hide content
    if (!user && !isPublicPath) {
      setShowContent(false);
      return;
    }

    // Case 2: Logged-in user on an auth page (login/register) → send to landing
    if (user && isPublicPath && pathname !== "/") {
      const resolveUserLanding = async () => {
        if (user.role === "admin") return "/admin/dashboard";

        const roleId = user.roleId;
        if (!roleId) return "/"; // Redirect to home if no role assigned

        try {
          const roleData = await apiClient.get<{ permissions: any[] }>(
            `/api/roles/${roleId}`,
          );
          const permissions = roleData.permissions || [];
          const landingRoutes = [
            { permissionId: "dashboard", href: "/user/dashboard" },
            { permissionId: "projects", href: "/user/projects" },
            { permissionId: "finance", href: "/user/finance" },
            { permissionId: "reports", href: "/user/reports" },
            { permissionId: "documents", href: "/user/documents" },
          ];

          const match = landingRoutes.find((route) =>
            hasPermission(route.permissionId, permissions),
          );

          return match?.href || "/";
        } catch {
          return "/";
        }
      };

      setShowContent(false);
      setLandingLoading(true);

      resolveUserLanding().then((dest) => {
        setLandingLoading(false);
        if (redirectingTo.current !== dest) {
          redirectingTo.current = dest;
          console.log("Authenticated, redirecting to", dest);
          router.replace(dest);
        }
      });

      return;
    }

    // Case 3: Protect non-admin users without roleId on protected pages
    if (user && !isPublicPath && user.role !== "admin" && !user.roleId) {
      if (redirectingTo.current !== "/") {
        redirectingTo.current = "/";
        console.log("User has no role assigned, redirecting to home");
        router.replace("/");
      }
      setShowContent(false);
      return;
    }

    // Case 4: Valid state — show the page content
    redirectingTo.current = null;
    setShowContent(true);
  }, [user, loading, pathname, router]);

  // Show loading spinner while checking auth or redirecting
  if (loading || landingLoading || !showContent) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            {loading ? "Loading..." : "Redirecting..."}
          </p>
        </div>
      </div>
    );
  }

  // Show message if role was revoked
  if (sessionExpiredReason === "ROLE_REVOKED") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900 dark:to-orange-900">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="mb-4">
            <div className="inline-block p-3 bg-red-100 dark:bg-red-800 rounded-full mb-4">
              <svg
                className="w-8 h-8 text-red-600 dark:text-red-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4v2m0 0v2M6 12a6 6 0 1112 0 6 6 0 01-12 0z"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-red-700 dark:text-red-200 mb-2">
            Role Access Revoked
          </h1>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Your role assignment has been removed by an administrator. You no
            longer have access to the platform.
          </p>
          <button
            onClick={() => {
              setSessionExpiredReason(null);
              router.replace("/");
            }}
            className="inline-block px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
