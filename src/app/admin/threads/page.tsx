"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import SessionGuard from "@/components/SessionGuard";
import { AdminSidebar } from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import FitoutLoadingSpinner from "@/components/FitoutLoadingSpinner";
import ThreadsPage from "@/components/ThreadsPage";
import { MessageSquareText } from "lucide-react";

export default function AdminThreadsRoute() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user && user.role !== "admin") {
      router.replace("/user/dashboard");
    }
  }, [user, authLoading, router]);

  if (authLoading) return <FitoutLoadingSpinner />;
  if (user && user.role !== "admin") return <FitoutLoadingSpinner />;

  return (
    <SessionGuard>
      <div className="min-h-screen bg-gray-50">
        <AdminSidebar userRole="admin" />
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
              A centralized stream of posts shared across your brand teams.
            </p>
          </div>

          {/* Threads Feed */}
          {user && (
            <ThreadsPage
              userRole="admin"
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