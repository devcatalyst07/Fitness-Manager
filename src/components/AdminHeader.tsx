import React, { useState, useEffect } from 'react';
import { Search, Bell, Settings, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';

export const AdminHeader: React.FC = () => {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const name = localStorage.getItem('userName') || 'Admin User';
    const email = localStorage.getItem('userEmail') || 'admin@fitoutmanager.com';
    setUserName(name);
    setUserEmail(email);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    router.push('/');
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 fixed top-0 right-0 left-64 z-10">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Title */}
        <h1 className="text-xl font-semibold text-gray-800">Fitout Manager</h1>

        {/* Right Section */}
        <div className="flex items-center space-x-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search projects, templates, vendors..."
              className="pl-10 pr-4 py-2 w-96 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 text-sm"
            />
            <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-gray-100 border border-gray-200 rounded text-xs text-gray-500">
              ⌘K
            </kbd>
          </div>

          {/* Icons */}
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell size={20} className="text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Settings size={20} className="text-gray-600" />
          </button>

          {/* User Profile */}
          <div className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors group relative">
            <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center text-white text-sm font-semibold">
              {userName.charAt(0)}
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold text-gray-800">
                Signed in as {userName} (Admin)
              </div>
              <div className="text-xs text-gray-500">tenant: acme</div>
            </div>
            <ChevronDown size={16} className="text-gray-600" />
            
            {/* Dropdown */}
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};