'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  Search,
  User,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AdminSidebar from '@/components/AdminSidebar';
import FitoutLoadingSpinner from '@/components/FitoutLoadingSpinner';
import AdminHeader from '@/components/AdminHeader'; 

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

interface ProjectStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  planningProjects: number;
  budgetUsedPercentage: number;
  projectsThisMonth: number;
  activeChange: number;
}

interface DashboardStats {
  totalUsers: number;
  chartData: ChartDataPoint[];
  users: UserData[];
  projectStats: ProjectStats;
}

type ChangeType = 'positive' | 'negative' | 'neutral';

// API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://fitout-manager-api.vercel.app';


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
    return <FitoutLoadingSpinner />;
  }

  const filteredChartData = getFilteredChartData();
  const projectStats = stats?.projectStats;

  // Calculate change indicators
  const getChangeType = (value: number): ChangeType => {
    if (value > 0) return 'positive';
    if (value < 0) return 'negative';
    return 'neutral';
  };

  const formatChange = (value: number, prefix: string = '') => {
    const sign = value > 0 ? '+' : '';
    return `${sign}${value} ${prefix}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar pathname={pathname} setPathname={setPathname} />
      <AdminHeader />

      <main className="lg:ml-64 mt-16 p-4 sm:p-6 lg:p-8 transition-all duration-300">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">Dashboard</h1>
        
        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <DashboardCard 
            title="Total Projects" 
            value={projectStats?.totalProjects || 0} 
            change={formatChange(projectStats?.projectsThisMonth || 0, 'from last month')} 
            changeType={getChangeType(projectStats?.projectsThisMonth || 0)} 
          />
          <DashboardCard 
            title="Active Tasks" 
            value={projectStats?.activeProjects || 0} 
            change={formatChange(projectStats?.activeChange || 0, 'from last week')} 
            changeType={getChangeType(projectStats?.activeChange || 0)} 
          />
          <DashboardCard 
            title="Budget Used" 
            value={`${projectStats?.budgetUsedPercentage || 0}%`} 
            change={`${projectStats?.budgetUsedPercentage || 0}% of total budget`} 
            changeType="neutral" 
          />
          <DashboardCard 
            title="Planning Projects" 
            value={projectStats?.planningProjects || 0} 
            change={`${projectStats?.completedProjects || 0} completed`} 
            changeType="neutral" 
          />
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