"use client";

import React, { useState, useEffect } from "react";
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
  ChevronDown,
  ChevronRight,
  User,
  Lock,
} from "lucide-react";
import Image from "next/image";
import { hasPermission } from "@/utils/permissions";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/axios";

// Use inline interface definition to avoid import issues
interface Permission {
  id: string;
  label: string;
  checked: boolean;
  children?: Permission[];
}

interface AdminSidebarProps {
  pathname?: string;
  setPathname?: React.Dispatch<React.SetStateAction<string>>;
  userRole?: string;
  permissions?: Permission[];
}

interface MenuItem {
  icon: React.ElementType;
  label: string;
  href: string;
  permissionId?: string;
}

export function AdminSidebar({
  pathname: propPathname,
  setPathname,
  userRole,
  permissions: permissionsProp,
}: AdminSidebarProps) {
  const router = useRouter();
  const currentPathname = usePathname();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [fetchedPermissions, setFetchedPermissions] = useState<
    Permission[] | null
  >(null);

  const resolvedRole = userRole ?? "admin";
  const isUser = resolvedRole === "user";

  // Effective permissions: prefer non-empty prop, otherwise use internally fetched
  const permissions =
    permissionsProp && permissionsProp.length > 0
      ? permissionsProp
      : (fetchedPermissions ?? undefined);

  // Auto-fetch permissions when parent page doesn't provide real permissions
  // Treats both undefined and empty [] as "no permissions provided"
  useEffect(() => {
    if (!isUser || permissionsProp?.length) return;

    const fetchPermissions = async () => {
      try {
        let roleId = user?.roleId;

        // If AuthContext doesn't have roleId, re-check /api/auth/me for fresh data
        // (handles case where admin assigned role while user is already logged in)
        if (!roleId && user) {
          try {
            const fresh = await apiClient.get<{ user: { roleId?: string } }>(
              "/api/auth/me",
            );
            roleId = fresh.user?.roleId ?? null;
          } catch {
            return;
          }
        }

        if (!roleId) return;

        const data = await apiClient.get<{ permissions: Permission[] }>(
          `/api/roles/${roleId}`,
        );
        setFetchedPermissions(data.permissions);
      } catch (err) {
        console.error("Failed to load sidebar permissions:", err);
      }
    };

    fetchPermissions();
  }, [isUser, permissionsProp?.length, user?.roleId]);

  // Use prop pathname if provided, otherwise use Next.js pathname
  const activePath = propPathname || currentPathname;

  const userMenuItems: MenuItem[] = [
    {
      icon: Home,
      label: "Dashboard",
      href: "/user/dashboard",
      permissionId: "dashboard",
    },
    {
      icon: FolderKanban,
      label: "Projects",
      href: "/user/projects",
      permissionId: "projects",
    },
    {
      icon: DollarSign,
      label: "Finance",
      href: "/user/finance",
      permissionId: "finance",
    },
    {
      icon: BarChart3,
      label: "Reports",
      href: "/user/reports",
      permissionId: "reports",
    },
    {
      icon: FileText,
      label: "Documents",
      href: "/user/documents",
      permissionId: "documents",
    },
  ];

  const adminMenuItems: MenuItem[] = [
    { icon: Home, label: "Dashboard", href: "/admin/dashboard" },
    { icon: FolderKanban, label: "Projects", href: "/admin/projects" },
    { icon: DollarSign, label: "Finance", href: "/admin/finance" },
    { icon: BarChart3, label: "Reports", href: "/admin/reports" },
    { icon: FileText, label: "Documents", href: "/admin/documents" },
  ];

  const menuItems = isUser
    ? userMenuItems.filter((item) =>
        permissions && item.permissionId
          ? hasPermission(item.permissionId, permissions)
          : false,
      )
    : adminMenuItems;

  const profileHref = isUser
    ? "/user/settings/profile"
    : "/admin/settings/profile";
  const changePasswordHref = isUser
    ? "/user/settings/change-password"
    : "/admin/settings/change-password";

  const handleNavClick = (href: string) => {
    if (setPathname) {
      setPathname(href);
    }
    setIsOpen(false);
    router.push(href); // Actually navigate to the page
  };

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
            className={`flex items-center ${isCollapsed ? "justify-center w-full" : ""}`}
          >
            {isCollapsed ? (
              <Image
                src="/files/FM_ICON.svg"
                alt="Fitout Manager Icon"
                width={48}
                height={48}
                className="object-contain"
              />
            ) : (
              <Image
                src="/files/FM_LOGO_LANDSCAPE.svg"
                alt="Fitout Manager Logo"
                width={200}
                height={48}
                className="object-contain"
              />
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

        {/* Menu Items */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {menuItems.map((item) => {
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

          {/* Admin Section */}
          {!isCollapsed && (
            <div className="mt-8 px-6 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {isUser ? "Account" : "Admin"}
            </div>
          )}
          {isCollapsed && (
            <div className="mt-8 border-t border-gray-200 pt-4" />
          )}

          {/* Settings Dropdown */}
          <div>
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={`w-full flex items-center justify-between px-6 py-3 transition-all duration-200 ease-in-out ${
                isCollapsed ? "justify-center" : ""
              } ${
                isSettingsOpen
                  ? "bg-gray-100 text-gray-700 border-r-2 border-gray-600"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-700"
              }`}
            >
              <div
                className={`flex items-center ${isCollapsed ? "justify-center" : "space-x-3"}`}
              >
                <Settings
                  size={20}
                  className={isSettingsOpen ? "text-gray-700" : ""}
                />
                {!isCollapsed && (
                  <span className="font-medium text-sm">Settings</span>
                )}
              </div>
              {!isCollapsed &&
                (isSettingsOpen ? (
                  <ChevronDown
                    size={18}
                    className="transition-transform duration-200"
                  />
                ) : (
                  <ChevronRight
                    size={18}
                    className="transition-transform duration-200"
                  />
                ))}
            </button>

            {/* Settings Submenu */}
            {isSettingsOpen && !isCollapsed && (
              <div className="bg-gradient-to-b from-gray-50 to-white border-t border-gray-100">
                <button
                  onClick={() => handleNavClick(profileHref)}
                  className={`w-full flex items-center space-x-3 px-8 py-3 text-sm transition-all duration-150 ${
                    activePath === profileHref
                      ? "bg-gray-100 text-gray-700 font-medium border-r-2 border-gray-600"
                      : "text-gray-600 hover:bg-gray-100 hover:text-blue-700"
                  }`}
                >
                  <User size={16} />
                  <span>Profile</span>
                </button>
                <button
                  onClick={() => handleNavClick(changePasswordHref)}
                  className={`w-full flex items-center space-x-3 px-8 py-3 text-sm transition-all duration-150 ${
                    activePath === changePasswordHref
                      ? "bg-gray-100 text-gray-700 font-medium border-r-2 border-gray-600"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-700"
                  }`}
                >
                  <Lock size={16} />
                  <span>Change Password</span>
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Footer */}
        {!isCollapsed && (
          <div className="p-6 border-t border-gray-200 text-xs text-gray-500">
            <div className="font-semibold">Fitout Manager</div>
            <div>2026 All Rights Reserved.</div>
          </div>
        )}
      </div>
    </>
  );
}

export default AdminSidebar;
