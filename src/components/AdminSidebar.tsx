'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Home, FolderKanban, DollarSign, BarChart3, FileText, Settings, ChevronLeft, Menu, X } from 'lucide-react';
import Image from 'next/image';

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

export function AdminSidebar({ pathname: propPathname, setPathname, userRole, permissions }: AdminSidebarProps) {
  const router = useRouter();
  const currentPathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Use prop pathname if provided, otherwise use Next.js pathname
  const activePath = propPathname || currentPathname;

  const menuItems = [
    { icon: Home, label: 'Dashboard', href: '/admin/dashboard' },
    { icon: FolderKanban, label: 'Projects', href: '/admin/projects' },
    { icon: DollarSign, label: 'Finance', href: '/admin/finance' },
    { icon: BarChart3, label: 'Reports', href: '/admin/reports' },
    { icon: FileText, label: 'Documents', href: '/admin/documents' },
  ];

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
          ${isCollapsed ? 'w-20' : 'w-64'}
          h-screen bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 z-40
          transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : ''}`}>
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
            isCollapsed ? 'justify-center' : 'space-x-2'
          }`}
        >
          <ChevronLeft size={20} className={`transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
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
                  isCollapsed ? 'justify-center' : 'space-x-3'
                } ${
                  isActive
                    ? 'bg-gray-100 text-black font-medium border-r-2 border-black'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-black'
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
              Admin
            </div>
          )}
          {isCollapsed && <div className="mt-8 border-t border-gray-200 pt-4" />}

          <button
            onClick={() => handleNavClick('/admin/settings')}
            className={`w-full flex items-center px-6 py-3 text-gray-600 hover:bg-gray-50 hover:text-black transition-colors ${
              isCollapsed ? 'justify-center' : 'space-x-3'
            }`}
          >
            <Settings size={20} />
            {!isCollapsed && <span>Settings</span>}
          </button>
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