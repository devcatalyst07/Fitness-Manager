"use client";

import React from "react";
import SessionGuard from "@/components/SessionGuard";
import NotificationsCenter from "@/components/NotificationsCenter";
import { AdminSidebar } from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";

export default function UserNotificationsPage() {
  return (
    <SessionGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <AdminSidebar userRole="user" />
        <AdminHeader />

        <main className="mt-16 lg:ml-[var(--fm-sidebar-width)] transition-all duration-300">
          <NotificationsCenter dashboardPath="/user/dashboard" />
        </main>
      </div>
    </SessionGuard>
  );
}
