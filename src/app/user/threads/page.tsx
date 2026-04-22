"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import SessionGuard from "@/components/SessionGuard";
import { AdminSidebar } from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import FitoutLoadingSpinner from "@/components/FitoutLoadingSpinner";
import ThreadsPage from "@/components/ThreadsPage";
import { apiClient } from "@/lib/axios";
import { hasPermission } from "@/utils/permissions";
import { MessageSquareText, Lock } from "lucide-react";

interface Permission {
  id: string;
  label: string;
  checked: boolean;
  children?: Permission[];
}

export default function UserThreadsRoute() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [permissions, setPermissions] = useState<Permission[] | null>(null);
  const [loadingPerms, setLoadingPerms] = useState(true);

  // Redirect admins
  useEffect(() => {
    if (!authLoading && user && user.role === "admin") {
      router.replace("/admin/threads");
    }
  }, [user, authLoading, router]);

  // Fetch role permissions
  useEffect(() => {
    if (!user || user.role !== "user") {
      setLoadingPerms(false);
      return;
    }

    const fetchPerms = async () => {
      try {
        let roleId = user.roleId;
        if (!roleId) {
          const fresh = await apiClient.get<{ user: { roleId?: string } }>("/api/auth/me");
          roleId = fresh.user?.roleId ?? undefined;
        }
        if (!roleId) { setLoadingPerms(false); return; }

        const data = await apiClient.get<{ permissions: Permission[] }>(`/api/roles/${roleId}`);
        setPermissions(data.permissions);
      } catch (err) {
        console.error("Failed to load permissions:", err);
      } finally {
        setLoadingPerms(false);
      }
    };

    fetchPerms();
  }, [user]);

  if (authLoading || loadingPerms) return <FitoutLoadingSpinner />;
  if (user && user.role !== "user") return <FitoutLoadingSpinner />;

  // Permission check
  // Allow if: "threads" permission exists OR no permission system is configured
  const canViewThreads = permissions
    ? hasPermission("threads", permissions) ||
      hasPermission("dashboard-threads", permissions) ||
      hasPermission("dashboard-add-threads", permissions)
    : true;

  if (permissions && !canViewThreads) {
    return (
      <SessionGuard>
        <div className="min-h-screen bg-gray-50">
          <AdminSidebar userRole="user" permissions={permissions ?? undefined} />
          <AdminHeader />
          <main className="lg:ml-[var(--fm-sidebar-width)] mt-16 p-4 sm:p-6 lg:p-8 transition-all duration-300">
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
                <Lock size={28} className="text-slate-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-700">Access Restricted</h2>
              <p className="text-slate-500 text-sm max-w-sm">
                You don't have permission to view Threads. Contact your administrator to request access.
              </p>
              <button
                onClick={() => router.push("/user/dashboard")}
                className="mt-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-all"
              >
                Back to Dashboard
              </button>
            </div>
          </main>
        </div>
      </SessionGuard>
    );
  }

  return (
    <SessionGuard>
      <div className="min-h-screen bg-gray-50">
        <AdminSidebar userRole="user" permissions={permissions ?? undefined} />
        <AdminHeader />

        <main className="lg:ml-[var(--fm-sidebar-width)] mt-16 p-4 sm:p-6 lg:p-8 transition-all duration-300">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center">
                <MessageSquareText size={18} className="text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Threads</h1>
            </div>
            <p className="text-gray-500 text-sm mt-1 ml-12">
              Stay connected with updates from your brand teams.
            </p>
          </div>

          {/* Threads Feed */}
          {user && (
            <ThreadsPage
              userRole="user"
              currentUserId={user.id}
              currentUserEmail={user.email}
              currentUserName={user.name}
            />
          )}
        </main>
      </div>
    </SessionGuard>
  );
}