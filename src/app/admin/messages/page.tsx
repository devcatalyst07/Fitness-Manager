"use client";

import React from "react";
import SessionGuard from "@/components/SessionGuard";
import { AdminSidebar } from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import MessagesPanel from "@/components/MessagesPanel";

export default function AdminMessagesPage() {
  return (
    <SessionGuard>
      <div className="h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
        <AdminSidebar userRole="admin" />
        <AdminHeader />

        <main className="mt-16 lg:ml-(--fm-sidebar-width) transition-all duration-300 p-4 lg:p-6 h-[calc(100vh-4rem)] box-border overflow-hidden">
          <MessagesPanel />
        </main>
      </div>
    </SessionGuard>
  );
}
