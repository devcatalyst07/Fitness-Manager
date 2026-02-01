"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Home,
  FolderKanban,
  DollarSign,
  BarChart3,
  FileText,
  Settings,
  ChevronLeft,
  Menu,
  X,
} from "lucide-react";
import { hasPermission } from "@/utils/permissions";

interface Permission {
  id: string;
  label: string;
  checked: boolean;
  children?: Permission[];
}

interface AdminSidebarProps {
  pathname?: string;
  setPathname?: React.Dispatch<React.SetStateAction<string>>;
  userRole?: "admin" | "user";
  permissions?: Permission[];
}

export function AdminSidebar({
  pathname: propPathname,
  setPathname,
  userRole = "admin",
  permissions = [],
}: AdminSidebarProps) {
  const router = useRouter();
  const currentPathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Use prop pathname if provided, otherwise use Next.js pathname
  const activePath = propPathname || currentPathname;

  // Determine base path based on role
  const basePath = userRole === "admin" ? "/admin" : "/user";

  // Helper to check permissions (admin bypasses all checks)
  const canAccess = (permissionId: string): boolean => {
    if (userRole === "admin") return true; // Admin sees everything
    return hasPermission(permissionId, permissions);
  };

  // Menu items with permission IDs
  const menuItems = [
    {
      icon: Home,
      label: "Dashboard",
      href: `${basePath}/dashboard`,
      permissionId: "dashboard",
    },
    {
      icon: FolderKanban,
      label: "Projects",
      href: `${basePath}/projects`,
      permissionId: "projects",
    },
    {
      icon: DollarSign,
      label: "Finance",
      href: `${basePath}/finance`,
      permissionId: "finance",
    },
    {
      icon: BarChart3,
      label: "Reports",
      href: `${basePath}/reports`,
      permissionId: "reports",
    },
    {
      icon: FileText,
      label: "Documents",
      href: `${basePath}/documents`,
      permissionId: "documents",
    },
  ];

  // Filter menu items based on permissions
  // const visibleMenuItems = menuItems.filter((item) =>
  //   hasPermission(item.permissionId, permissions),
  // );
  const visibleMenuItems =
    userRole === "admin"
      ? menuItems // Admin sees all
      : menuItems.filter((item) =>
          hasPermission(item.permissionId, permissions),
        );

  const handleNavClick = (href: string) => {
    if (setPathname) {
      setPathname(href);
    }
    setIsOpen(false);
    router.push(href);
  };

  // Show settings only for admin
  const showSettings = userRole === "admin";

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg border border-gray-200"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          ${isCollapsed ? "w-20" : "w-64"}
          h-screen bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 z-40
          transition-all duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div
            className={`flex items-center ${isCollapsed ? "justify-center w-full" : "space-x-3"}`}
          >
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">FM</span>
            </div>
            {!isCollapsed && (
              <div>
                <div className="font-bold text-black text-lg">FITOUT</div>
                <div className="font-bold text-black text-sm">MANAGER</div>
              </div>
            )}
          </div>
        </div>

        {/* Collapse Button - Hidden on mobile */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`hidden lg:flex px-6 py-4 items-center text-gray-600 hover:text-black border-b border-gray-200 ${
            isCollapsed ? "justify-center" : "space-x-2"
          }`}
        >
          <ChevronLeft
            size={20}
            className={`transition-transform ${isCollapsed ? "rotate-180" : ""}`}
          />
          {!isCollapsed && <span className="text-sm">Collapse</span>}
        </button>

        {/* Menu Items - Filtered by permissions */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {visibleMenuItems.length === 0 && userRole === "user" && (
            <div className="px-6 py-4 text-sm text-gray-500 text-center">
              No pages available.
              <br />
              Contact administrator.
            </div>
          )}

          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePath === item.href;
            return (
              <button
                key={item.href}
                onClick={() => handleNavClick(item.href)}
                className={`w-full flex items-center px-6 py-3 transition-colors ${
                  isCollapsed ? "justify-center" : "space-x-3"
                } ${
                  isActive
                    ? "bg-gray-100 text-black font-medium border-r-2 border-black"
                    : "text-gray-600 hover:bg-gray-50 hover:text-black"
                }`}
              >
                <Icon size={20} />
                {!isCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}

          {/* Admin Section - Only for admins */}
            <>
              {!isCollapsed && (
                <div className="mt-8 px-6 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Admin
                </div>
              )}
              {isCollapsed && (
                <div className="mt-8 border-t border-gray-200 pt-4" />
              )}

              <button
                onClick={() => handleNavClick(`${basePath}/settings`)}
                className={`w-full flex items-center px-6 py-3 text-gray-600 hover:bg-gray-50 hover:text-black transition-colors ${
                  isCollapsed ? "justify-center" : "space-x-3"
                }`}
              >
                <Settings size={20} />
                {!isCollapsed && <span>Settings</span>}
              </button>
            </>
          {/* )} */}
        </nav>

        {/* Footer */}
        {!isCollapsed && (
          <div className="p-6 border-t border-gray-200 text-xs text-gray-500">
            <div className="font-semibold">Fitout Manager</div>
            <div>v2025.01 • {userRole === "admin" ? "Admin" : "User"} Mode</div>
          </div>
        )}
      </div>
    </>
  );
}

export default AdminSidebar;