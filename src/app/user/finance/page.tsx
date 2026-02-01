'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DollarSign, TrendingUp, AlertTriangle, FileDown, Filter, ShieldCheck } from 'lucide-react';

import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import FitoutLoadingSpinner from '@/components/FitoutLoadingSpinner';
import EACPolicyModal from '@/components/EACPolicyModal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://fitout-manager-api.vercel.app';

interface ProjectFinance {
  _id: string;
  projectName: string;
  brand: string;
  region: string;
  budget: number;
  committed: number;
  invoiced: number;
  paid: number;
  accruals: number;
  headroom: number;
  eac: number;
  variance: number;
  utilisation: number;
  eacFactor: number;
}

interface PendingApproval {
  _id: string;
  type: string;
  amount: number;
  projectId: {
    _id: string;
    projectName: string;
  };
  description: string;
}

interface FinanceData {
  summary: {
    totalBudget: number;
    totalCommitted: number;
    committedChange: number;
    totalVariance: number;
    totalUtilisation: number;
    projectsAtRisk: number;
  };
  portfolioTotals: {
    budget: number;
    committed: number;
    invoiced: number;
    paid: number;
    accruals: number;
    headroom: number;
    eac: number;
    variance: number;
  };
  projects: ProjectFinance[];
  pendingApprovals: PendingApproval[];
  filters: {
    brands: string[];
    regions: string[];
  };
}

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

const hasPermission = (
  permissionId: string,
  permissions: Permission[],
): boolean => {
  const check = (perms: Permission[]): boolean => {
    for (const perm of perms) {
      if (perm.id === permissionId && perm.checked) return true;
      if (perm.children && check(perm.children)) return true;
    }
    return false;
  };
  return check(permissions);
};

export default function userFinancePage() {
  const router = useRouter();
  const [pathname, setPathname] = useState('/user/finance');
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);
    const [roleData, setRoleData] = useState<RoleData | null>(null);
  const [financeData, setFinanceData] = useState<FinanceData | null>(null);

  const [selectedBrand, setSelectedBrand] = useState<string>('All');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');

  const [isEACModalOpen, setIsEACModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectFinance | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");
    const roleId = localStorage.getItem("roleId");

    if (!token || role !== "user") {
      localStorage.clear();
      router.replace("/");
    } else if (!roleId) {
      alert("No role assigned. Contact administrator.");
      router.replace("/");
    } else {
      setIsVerified(true);
      fetchRolePermissions(roleId);
    }
  }, [router]);
    
    const fetchRolePermissions = async (roleId: string) => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_URL}/api/roles/${roleId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setRoleData(data);

          if (!hasPermission("finance", data.permissions)) {
            alert("You do not have permission to access Finance.");
            router.replace("/user/dashboard");
            return;
          }

        } else {
          alert("Failed to load permissions.");
          router.replace("/");
        }
      } catch (error) {
        console.error("Error fetching permissions:", error);
        alert("Failed to load permissions.");
        router.replace("/");
      } finally {
        setLoading(false);
      }
    };

  const fetchFinanceData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const params = new URLSearchParams();
      if (selectedBrand !== 'All') params.append('brand', selectedBrand);
      if (selectedRegion !== 'All') params.append('region', selectedRegion);

      const url = `${API_URL}/api/finance?${params.toString()}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }

      const data = await response.json();
      setFinanceData(data);
    } catch (error) {
      console.error('Error fetching finance data:', error);
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

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  const handleResetFilters = () => {
    setSelectedBrand('All');
    setSelectedRegion('All');
  };

  const handleExportCSV = () => {
    if (!financeData) return;

    const headers = [
      'Project',
      'Brand',
      'Region',
      'Budget',
      'Committed',
      'Invoiced',
      'Paid',
      'Accruals',
      'Headroom',
      'EAC',
      'Variance',
      'Utilisation',
    ];

    const rows = financeData.projects.map(p => [
      p.projectName,
      p.brand,
      p.region,
      p.budget,
      p.committed,
      p.invoiced,
      p.paid,
      p.accruals,
      p.headroom,
      p.eac,
      p.variance,
      p.utilisation,
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (!isVerified || loading) {
    return <FitoutLoadingSpinner />;
  }

  if (!roleData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            No Permissions
          </h2>
          <p className="text-gray-600">Contact administrator.</p>
        </div>
      </div>
    );
  }

  const permissions = roleData.permissions;
  const canExportCSV = hasPermission("finance-Export", permissions);
  const canManageEACPolicy = hasPermission("finance-policy", permissions);

  const summary = financeData?.summary;
  const totals = financeData?.portfolioTotals;
    
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar
        pathname={pathname}
        setPathname={setPathname}
        userRole="user"
        permissions={permissions}
      />
      <AdminHeader />

      <main className="lg:ml-64 mt-16 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">
            Financial Control Centre
          </h1>
          <p className="text-sm text-gray-600">
            Portfolio-level budget oversight and financial governance.
          </p>
        </div>

        {/* Pending Approvals */}
        {financeData && financeData.pendingApprovals.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-start gap-3">
                <div className="text-gray-600 mt-0.5">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Pending Approvals
                  </h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {financeData.pendingApprovals
                      .slice(0, 2)
                      .map((approval) => (
                        <li key={approval._id}>
                          • {approval.projectId.projectName} —{" "}
                          {approval.description} (
                          {formatCurrency(approval.amount)})
                        </li>
                      ))}
                  </ul>
                </div>
              </div>

              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                Review All
              </button>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm text-gray-600">Total Budget</h3>
              <DollarSign size={16} className="text-gray-400" />
            </div>
            <p className="text-2xl font-semibold text-gray-900">
              {formatCurrency(summary?.totalBudget || 0)}
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm text-gray-600">Committed</h3>
              <TrendingUp size={16} className="text-gray-400" />
            </div>
            <p className="text-2xl font-semibold text-gray-900">
              {formatCurrency(summary?.totalCommitted || 0)}
            </p>
            <p className="text-xs text-green-600 mt-1">
              {summary && summary.committedChange > 0 ? "↗" : "↘"}{" "}
              {formatPercentage(Math.abs(summary?.committedChange || 0))}
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm text-gray-600">Variance</h3>
              <TrendingUp size={16} className="text-gray-400" />
            </div>
            <p
              className={`text-2xl font-semibold ${
                (summary?.totalVariance || 0) < 0
                  ? "text-red-600"
                  : "text-green-600"
              }`}
            >
              {formatCurrency(summary?.totalVariance || 0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {(summary?.totalVariance || 0) < 0
                ? "Over budget"
                : "Under budget"}
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm text-gray-600">Utilisation</h3>
              <ShieldCheck size={16} className="text-gray-400" />
            </div>
            <p className="text-2xl font-semibold text-gray-900">
              {formatPercentage(summary?.totalUtilisation || 0)}
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm text-gray-600">Projects at Risk</h3>
              <AlertTriangle size={16} className="text-red-400" />
            </div>
            <p className="text-2xl font-semibold text-red-600">
              {summary?.projectsAtRisk || 0}
            </p>
          </div>
        </div>

        {/* Filters + Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
              <span className="text-sm font-medium">Brand</span>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="text-sm border-none outline-none bg-transparent"
              >
                <option value="All">All</option>
                {financeData?.filters.brands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
              <span className="text-sm font-medium">Region</span>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="text-sm border-none outline-none bg-transparent"
              >
                <option value="All">All</option>
                {financeData?.filters.regions.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>

            {(selectedBrand !== "All" || selectedRegion !== "All") && (
              <button
                onClick={handleResetFilters}
                className="text-sm text-blue-600 hover:text-blue-800 px-3 py-2"
              >
                Reset Filters
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter size={16} />
              <span className="text-sm">Advanced Filters</span>
            </button>
            {canExportCSV && (
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <FileDown size={16} />
                <span className="text-sm">Export CSV</span>
              </button>
            )}
          </div>
        </div>

        {/* Finance Table (Option 3 - Luxury) */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-100 uppercase">
                    Project
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-100 uppercase">
                    Budget
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-100 uppercase">
                    Committed
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-100 uppercase">
                    Invoiced
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-100 uppercase">
                    Paid
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-100 uppercase">
                    Accruals
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-100 uppercase">
                    Headroom
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-100 uppercase">
                    EAC
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-100 uppercase">
                    Variance
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-100 uppercase">
                    Utilisation
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-100 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {financeData?.projects.map((project) => (
                  <tr key={project._id} className="hover:bg-gray-50">
                    <td className="px-6 py-5">
                      <div className="font-medium text-gray-900">
                        {project.projectName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {project.brand} • {project.region}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm text-gray-900">
                      {formatCurrency(project.budget)}
                    </td>
                    <td className="px-6 py-5 text-sm text-gray-900">
                      {formatCurrency(project.committed)}
                    </td>
                    <td className="px-6 py-5 text-sm text-gray-900">
                      {formatCurrency(project.invoiced)}
                    </td>
                    <td className="px-6 py-5 text-sm text-gray-900">
                      {formatCurrency(project.paid)}
                    </td>
                    <td className="px-6 py-5 text-sm text-gray-900">
                      {formatCurrency(project.accruals)}
                    </td>
                    <td className="px-6 py-5 text-sm text-gray-900">
                      {formatCurrency(project.headroom)}
                    </td>
                    <td className="px-6 py-5 text-sm text-gray-900">
                      {formatCurrency(project.eac)}
                    </td>
                    <td
                      className={`px-6 py-5 text-sm font-semibold ${
                        project.variance < 0 ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {formatCurrency(project.variance)}
                    </td>
                    <td className="px-6 py-5 text-sm text-gray-900">
                      {formatPercentage(project.utilisation)}
                    </td>
                    <td className="px-6 py-5">
                      {canManageEACPolicy && (
                        <button
                          onClick={() => {
                            setSelectedProject(project);
                            setIsEACModalOpen(true);
                          }}
                          className="text-sm text-gray-100 hover:text-white bg-gray-700 px-3 py-1 rounded-md"
                        >
                          EAC Policy
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>

              <tfoot className="bg-gray-50 border-t border-gray-300">
                <tr>
                  <td className="px-6 py-4 font-bold text-gray-900">
                    Portfolio Totals
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">
                    {formatCurrency(totals?.budget || 0)}
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">
                    {formatCurrency(totals?.committed || 0)}
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">
                    {formatCurrency(totals?.invoiced || 0)}
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">
                    {formatCurrency(totals?.paid || 0)}
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">
                    {formatCurrency(totals?.accruals || 0)}
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">
                    {formatCurrency(totals?.headroom || 0)}
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">
                    {formatCurrency(totals?.eac || 0)}
                  </td>
                  <td
                    className={`px-6 py-4 font-bold ${
                      (totals?.variance || 0) < 0
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    {formatCurrency(totals?.variance || 0)}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </main>

      {/* EAC Policy Modal */}
      {isEACModalOpen && selectedProject && (
        <EACPolicyModal
          isOpen={isEACModalOpen}
          onClose={() => {
            setIsEACModalOpen(false);
            setSelectedProject(null);
          }}
          projectId={selectedProject._id}
          projectName={selectedProject.projectName}
          currentFactor={selectedProject.eacFactor}
          onUpdate={fetchFinanceData}
        />
      )}
    </div>
  );
}