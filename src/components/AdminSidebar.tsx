import React, { useState } from 'react';
import { Home, FolderKanban, DollarSign, BarChart3, FileText, Settings, ChevronLeft, Menu, X } from 'lucide-react';

export default function AdminSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [pathname, setPathname] = useState('/admin/dashboard');

  const menuItems = [
    { icon: Home, label: 'Dashboard', href: '/admin/dashboard' },
    { icon: FolderKanban, label: 'Projects', href: '/admin/projects' },
    { icon: DollarSign, label: 'Finance', href: '/admin/finance' },
    { icon: BarChart3, label: 'Reports', href: '/admin/reports' },
    { icon: FileText, label: 'Documents', href: '/admin/documents' },
  ];

  const handleNavClick = (href) => {
    setPathname(href);
    setIsOpen(false);
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
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
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
          <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'space-x-3'}`}>
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
            const isActive = pathname === item.href;
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
            <div>v2025.01 • UI Overhaul</div>
          </div>
        )}
      </div>

      {/* Spacer for main content on desktop */}
      <div className={`hidden lg:block ${isCollapsed ? 'w-20' : 'w-64'} transition-all duration-300`} />
    </>
  );
}