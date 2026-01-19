'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import FitoutLoadingSpinner from '@/components/FitoutLoadingSpinner';
import AdminHeader from '@/components/AdminHeader';
import BrandManagement from '@/components/BrandManagement';
import ActiveTasksList from '@/components/ActiveTasksList';
import BudgetTasksList from '@/components/BudgetTasksList';
import ProjectAnalyticsCharts from '@/components/ProjectAnalyticsCharts';
import BrandAnalyticsCharts from '@/components/BrandAnalyticsCharts';

// Types
interface ProjectStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  planningProjects: number;
  budgetUsedPercentage: number;
  projectsThisMonth: number;
  activeChange: number;
}

interface Task {
  _id: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: string;
  assignees: { name: string; email: string }[];
  projectId: {
    _id: string;
    projectName: string;
    brand: string;
  };
}

interface BudgetItem {
  _id: string;
  description: string;
  vendor: string;
  quantity: number;
  unitCost: number;
  committedStatus: string;
  category: string;
  projectId: {
    _id: string;
    projectName: string;
    brand: string;
  };
}

interface ProjectAnalytic {
  projectId: string;
  projectName: string;
  brand: string;
  taskStatusData: { status: string; count: number }[];
  budgetStatusData: { status: string; amount: number }[];
  totalTasks: number;
  completedTasks: number;
  totalBudget: number;
  totalSpent: number;
}

interface BrandAnalytic {
  brandId: string;
  brandName: string;
  projectCount: number;
  taskStatusData: { status: string; count: number }[];
  budgetStatusData: { status: string; amount: number }[];
  totalTasks: number;
  completedTasks: number;
  totalBudget: number;
  totalSpent: number;
}

interface Brand {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdBy: {
    name: string;
    email: string;
  };
  createdAt: string;
}

interface DashboardStats {
  projectStats: ProjectStats;
  activeTasks: Task[];
  budgetTasks: BudgetItem[];
  projectAnalytics: ProjectAnalytic[];
  brandAnalytics: BrandAnalytic[];
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

// ==================== AdminDashboard ====================
export default function AdminDashboard() {
  const router = useRouter();
  const [pathname, setPathname] = useState('/admin/dashboard');
  const [isVerified, setIsVerified] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');

    if (!token || role !== 'admin') {
      localStorage.clear();
      router.replace('/');
    } else {
      setIsVerified(true);
      fetchDashboardStats();
      fetchBrands();
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

  const fetchBrands = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/brands/all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBrands(data);
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
    }
  };

  if (!isVerified || loading) {
    return <FitoutLoadingSpinner />;
  }

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

        {/* Brand Management */}
        <div className="mb-8">
          <BrandManagement brands={brands} onRefresh={fetchBrands} />
        </div>

        {/* Active Tasks List */}
        <div className="mb-8">
          <ActiveTasksList tasks={stats?.activeTasks || []} />
        </div>

        {/* Budget Tasks List */}
        <div className="mb-8">
          <BudgetTasksList budgetItems={stats?.budgetTasks || []} />
        </div>

        {/* Project Analytics Charts */}
        <div className="mb-8">
          <ProjectAnalyticsCharts projectAnalytics={stats?.projectAnalytics || []} />
        </div>

        {/* Brand Analytics Charts */}
        <div className="mb-8">
          <BrandAnalyticsCharts brandAnalytics={stats?.brandAnalytics || []} />
        </div>
      </main>
    </div>
  );
}