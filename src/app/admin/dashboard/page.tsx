'use client';

'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Bell,
  Search,
  User,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

// Types
interface UserData {
  id: string;
  name: string;
  email: string;
  subscriptionType: string;
  totalProjects: number;
  status: string;
  createdAt: string;
}

interface ChartDataPoint {
  date: string;
  count: number;
}

interface DashboardStats {
  totalUsers: number;
  chartData: ChartDataPoint[];
  users: UserData[];
}

type ChangeType = 'positive' | 'negative' | 'neutral';

// API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://fitout-manager-api.vercel.app';

// ==================== AdminSidebar ====================
function AdminSidebar({
  pathname,
  setPathname,
}: {
  pathname: string;
  setPathname: React.Dispatch<React.SetStateAction<string>>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { icon: Home, label: 'Dashboard', href: '/admin/dashboard' },
    { icon: FolderKanban, label: 'Projects', href: '/admin/projects' },
    { icon: DollarSign, label: 'Finance', href: '/admin/finance' },
    { icon: BarChart3, label: 'Reports', href: '/admin/reports' },
    { icon: FileText, label: 'Documents', href: '/admin/documents' },
  ];

  const handleNavClick = (href: string) => {
    setPathname(href);
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg border border-gray-200"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div
        className={`
          ${isCollapsed ? 'w-20' : 'w-64'}
          h-screen bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 z-40
          transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
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

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`hidden lg:flex px-6 py-4 items-center text-gray-600 hover:text-black border-b border-gray-200 ${
            isCollapsed ? 'justify-center' : 'space-x-2'
          }`}
        >
          <ChevronLeft size={20} className={`transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
          {!isCollapsed && <span className="text-sm">Collapse</span>}
        </button>

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

        {!isCollapsed && (
          <div className="p-6 border-t border-gray-200 text-xs text-gray-500">
            <div className="font-semibold">Fitout Manager</div>
            <div>v2025.01 • UI Overhaul</div>
          </div>
        )}
      </div>
    </>
  );
}

// ==================== AdminHeader ====================
function AdminHeader() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const name = localStorage.getItem('userName') || 'Admin';
    setUserName(name);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
  };

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 bg-white border-b border-gray-200 z-20 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
      <div className="flex-auto max-w-xs sm:ml-0 ml-12 mt-2 sm:mt-0">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="hidden sm:block text-gray-700 text-sm font-medium whitespace-nowrap">
          <strong>{`Welcome, ${userName}. You are now signed in.`}</strong>
        </div>

        <button className="p-2 hover:bg-gray-100 rounded-lg relative">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-1 p-2 hover:bg-gray-100 rounded-lg"
          >
            <User size={20} />
            <ChevronDown size={16} className={`${dropdownOpen ? 'rotate-180' : ''} transition-transform`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="sm:hidden absolute right-4 top-16 text-gray-700 text-sm font-medium">
        <strong>{`Welcome, ${userName}.`}</strong>
      </div>
    </header>
  );
}

// ==================== DashboardCard ====================
interface DashboardCardProps {
  title: string;
  value: string | number;
  change: string | number;
  changeType: ChangeType;
}

function DashboardCard({ title, value, change, changeType }: DashboardCardProps) {
  const changeColor: Record<ChangeType, string> = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-600',
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>
      <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
      <p className={`text-sm ${changeColor[changeType]}`}>{change}</p>
    </div>
  );
}

// ==================== UserChart ====================
function UserChart({ data }: { data: ChartDataPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        No data available
      </div>
    );
  }

  const chartData = data.map(point => {
    const date = new Date(point.date);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      users: point.count,
    };
  });

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="date" 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            allowDecimals={false}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '8px 12px'
            }}
          />
          <Line
            type="monotone"
            dataKey="users"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5, stroke: '#fff' }}
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}


// ==================== UserTable ====================
function UserTable({ users }: { users: UserData[] }) {
  if (users.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        No users registered yet
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Full Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Subscription Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Projects
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {user.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {user.subscriptionType}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {user.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {user.totalProjects}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ==================== AdminDashboard ====================
export default function AdminDashboard() {
  const router = useRouter();
  const [pathname, setPathname] = useState('/admin/dashboard');
  const [isVerified, setIsVerified] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7days' | '30days' | '3months'>('30days');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');

    if (!token || role !== 'admin') {
      localStorage.clear();
      router.replace('/');
    } else {
      setIsVerified(true);
      fetchDashboardStats();
    }
  }, [router]);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredChartData = () => {
    if (!stats?.chartData) return [];

    const now = new Date();
    const daysMap = {
      '7days': 7,
      '30days': 30,
      '3months': 90,
    };

    const daysAgo = new Date(now.getTime() - daysMap[dateRange] * 24 * 60 * 60 * 1000);

    return stats.chartData.filter(point => new Date(point.date) >= daysAgo);
  };

  if (!isVerified || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const filteredChartData = getFilteredChartData();

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar pathname={pathname} setPathname={setPathname} />
      <AdminHeader />

      <main className="lg:ml-64 mt-16 p-4 sm:p-6 lg:p-8 transition-all duration-300">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">Dashboard</h1>
        
        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <DashboardCard title="Total Projects" value="0" change="+0 from last month" changeType="neutral" />
          <DashboardCard title="Active Tasks" value="0" change="+0 from last week" changeType="neutral" />
          <DashboardCard title="Budget Used" value="0%" change="+0% from last month" changeType="neutral" />
          <DashboardCard title="Open RFQs" value="0" change="0 from last week" changeType="neutral" />
        </div>

        {/* New Users Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Total New Users</h2>
              <p className="text-sm text-gray-500 mt-1">
                Total for the last {dateRange === '7days' ? '7 days' : dateRange === '30days' ? '30 days' : '3 months'}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setDateRange('7days')}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                  dateRange === '7days'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Last 7 days
              </button>
              <button
                onClick={() => setDateRange('30days')}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                  dateRange === '30days'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Last 30 days
              </button>
              <button
                onClick={() => setDateRange('3months')}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                  dateRange === '3months'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Last 3 months
              </button>
            </div>
          </div>
          <UserChart data={filteredChartData} />
        </div>

        {/* User Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Registered Users</h2>
          </div>
          <UserTable users={stats?.users || []} />
        </div>
      </main>
    </div>
  );
}