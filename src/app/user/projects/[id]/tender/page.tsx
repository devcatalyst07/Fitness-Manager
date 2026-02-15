'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/axios';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import FitoutLoadingSpinner from '@/components/FitoutLoadingSpinner';
import { hasPermission } from '@/utils/permissions';

interface Permission {
  id: string;
  label: string;
  checked: boolean;
  children?: Permission[];
}

interface RoleData {
  _id: string;
  name: string;
  permissions: Permission[];
}

interface Tender {
  _id: string;
  tenderNumber: string;
  title: string;
  description: string;
  category: string;
  status: string;
  budgetedAmount: number;
  issueDate?: string;
  submissionDeadline?: string;
  createdBy: { name: string; email: string };
  createdAt: string;
}

export default function UserProjectTenderPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();

  const [pathname, setPathname] = useState('/user/projects');
  const [loading, setLoading] = useState(true);
  const [roleData, setRoleData] = useState<RoleData | null>(null);
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [projectName, setProjectName] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/');
      return;
    }
    if (!authLoading && user && user.role === 'admin') {
      router.replace(`/admin/projects/${params.id}/tender`);
      return;
    }
  }, [user, authLoading, router, params.id]);

  useEffect(() => {
    if (user && user.role === 'user' && params.id) {
      fetchRolePermissions();
    }
  }, [user, params.id]);

  const fetchRolePermissions = async () => {
    try {
      let roleId = (user as any)?.roleId;
      if (!roleId) {
        try {
          const profile = await apiClient.get('/api/auth/me');
          roleId = profile?.roleId;
        } catch {}
      }
      if (roleId) {
        const data = await apiClient.get(`/api/roles/${roleId}`);
        setRoleData(data);
        if (!hasPermission('projects-view-details-tender', data.permissions)) {
          alert('You do not have permission to access Tender.');
          router.replace('/user/projects');
          return;
        }
      }
      fetchProject();
      fetchTenders();
    } catch (error) {
      console.error('Error fetching permissions:', error);
      fetchProject();
      fetchTenders();
    } finally {
      setLoading(false);
    }
  };

  const fetchProject = async () => {
    try {
      const data = await apiClient.get(`/api/projects/${params.id}`);
      setProjectName(data.projectName);
    } catch (error) {
      console.error('Error fetching project:', error);
    }
  };

  const fetchTenders = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get(`/api/projects/${params.id}/tenders`);
      setTenders(data);
    } catch (error) {
      console.error('Error fetching tenders:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      Draft: 'bg-gray-100 text-gray-700',
      Issued: 'bg-blue-100 text-blue-700',
      RFI: 'bg-yellow-100 text-yellow-700',
      'Bid Evaluation': 'bg-purple-100 text-purple-700',
      Awarded: 'bg-green-100 text-green-700',
      Cancelled: 'bg-red-100 text-red-700',
    };
    return badges[status] || 'bg-gray-100 text-gray-700';
  };

  if (authLoading || loading) return <FitoutLoadingSpinner />;
  if (!user || user.role !== 'user') return <FitoutLoadingSpinner />;

  const permissions = roleData?.permissions || [];
  const hasRoleData = !!roleData;
  const canViewOverview = !hasRoleData || hasPermission('projects-view-details-overview', permissions);
  const canViewTasks = !hasRoleData || hasPermission('projects-view-details-task', permissions);
  const canViewBudget = !hasRoleData || hasPermission('projects-view-details-budget', permissions);
  const canViewDocuments = !hasRoleData || hasPermission('projects-view-details-documents', permissions);
  const canViewTeam = !hasRoleData || hasPermission('projects-view-details-team', permissions);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar pathname={pathname} setPathname={setPathname} userRole="user" permissions={permissions} />
      <AdminHeader />

      <main className="lg:ml-64 mt-16 p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <button
            onClick={() => router.push('/user/projects')}
            className="text-gray-600 hover:text-black mb-4 flex items-center gap-2"
          >
            <span>Back</span>
            <span>{projectName || 'Back to Project'}</span>
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Tender & Procurement
            </h1>
            <p className="text-sm text-gray-600">
              View tender information and procurement status
              {roleData && ` - Role: ${roleData.name}`}
            </p>
          </div>
        </div>

        <div className="mb-6 border-b border-gray-200 overflow-x-auto">
          <div className="flex gap-6 whitespace-nowrap">
            {canViewOverview && (
              <button
                onClick={() => router.push(`/user/projects/${params.id}/overview`)}
                className="pb-3 px-1 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700"
              >
                Overview
              </button>
            )}
            {canViewTasks && (
              <button
                onClick={() => router.push(`/user/projects/${params.id}/tasks`)}
                className="pb-3 px-1 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700"
              >
                Tasks
              </button>
            )}
            {canViewBudget && (
              <button
                onClick={() => router.push(`/user/projects/${params.id}/budget`)}
                className="pb-3 px-1 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700"
              >
                Budget
              </button>
            )}
            <button className="pb-3 px-1 text-sm font-medium border-b-2 border-black text-black">
              Tender
            </button>
            {canViewDocuments && (
              <button
                onClick={() => router.push(`/user/projects/${params.id}/documents`)}
                className="pb-3 px-1 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700"
              >
                Documents
              </button>
            )}
            {canViewTeam && (
              <button
                onClick={() => router.push(`/user/projects/${params.id}/team`)}
                className="pb-3 px-1 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700"
              >
                Team
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Active Tenders ({tenders.length})
            </h2>
          </div>

          {tenders.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-gray-400 mb-4 text-4xl">📋</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No tenders yet</h3>
              <p className="text-gray-600">
                No procurement activities for this project yet
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Tender Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Budget
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Deadline
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {tenders.map((tender) => (
                    <tr key={tender._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {tender.tenderNumber}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {tender.title}
                        </div>
                        <div className="text-xs text-gray-500">{tender.description}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{tender.category}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatCurrency(tender.budgetedAmount)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(tender.status)}`}
                        >
                          {tender.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatDate(tender.submissionDeadline)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}