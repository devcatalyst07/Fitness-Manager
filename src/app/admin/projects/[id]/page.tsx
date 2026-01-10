'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Calendar, Building2, MapPin, Save, X as XIcon, Edit } from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import FitoutLoadingSpinner from '@/components/FitoutLoadingSpinner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://fitout-manager-api.vercel.app';

interface Project {
  _id: string;
  projectName: string;
  brand: string;
  scope: string;
  workflow: string;
  projectCode?: string;
  description?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  budget: number;
  spent: number;
  status: 'Planning' | 'In Progress' | 'Completed' | 'On Hold';
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  createdBy: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export default function ProjectDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const [pathname, setPathname] = useState('/admin/projects');
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Project>>({});
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');

    if (!token || role !== 'admin') {
      localStorage.clear();
      router.replace('/');
    } else {
      setIsVerified(true);
      fetchProject();
    }
  }, [params.id, router]);

  const fetchProject = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/projects/${params.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch project');
      }

      const data = await response.json();
      setProject(data);
      setFormData(data);
    } catch (error) {
      console.error('Error fetching project:', error);
      alert('Failed to load project');
      router.push('/admin/projects');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/projects/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update project');
      }

      const updated = await response.json();
      setProject(updated.project);
      setFormData(updated.project);
      setEditing(false);
      alert('Project updated successfully!');
    } catch (error) {
      console.error('Update error:', error);
      alert('Failed to update project. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(project || {});
    setEditing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
  };

  if (!isVerified || loading) {
    return <FitoutLoadingSpinner />;
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Project not found</h1>
          <button
            onClick={() => router.push('/admin/projects')}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Projects
          </button>
        </div>
      </div>
    );
  }

  const budgetUtilization = project.budget > 0 ? (project.spent / project.budget) * 100 : 0;
  const remaining = project.budget - project.spent;

  const statusColors: { [key: string]: string } = {
    'Planning': 'bg-orange-100 text-orange-700 border-orange-300',
    'In Progress': 'bg-blue-100 text-blue-700 border-blue-300',
    'Completed': 'bg-green-100 text-green-700 border-green-300',
    'On Hold': 'bg-gray-100 text-gray-700 border-gray-300',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar pathname={pathname} setPathname={setPathname} />
      <AdminHeader />

      <main className="lg:ml-64 mt-16 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/admin/projects')}
            className="text-gray-600 hover:text-black mb-4 flex items-center gap-2 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Projects</span>
          </button>

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.projectName}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Building2 size={16} />
                  {project.brand}
                </span>
                {project.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={16} />
                    {project.location}
                  </span>
                )}
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[project.status]}`}>
                  {project.status}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <Edit size={18} />
                  <span>Edit Project</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <XIcon size={18} />
                    <span>Cancel</span>
                  </button>
                  <button
                    onClick={handleUpdate}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    <Save size={18} />
                    <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Details Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold mb-6">Project Details</h2>

              <div className="space-y-6">
                {/* Project Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Name
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.projectName || ''}
                      onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900 text-lg">{project.projectName}</p>
                  )}
                </div>

                {/* Brand and Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Brand
                    </label>
                    {editing ? (
                      <select
                        value={formData.brand || ''}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Westfield Group">Westfield Group</option>
                        <option value="Scentre Group">Scentre Group</option>
                        <option value="Unibail-Rodamco-Westfield">Unibail-Rodamco-Westfield</option>
                      </select>
                    ) : (
                      <p className="text-gray-900">{project.brand}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    {editing ? (
                      <select
                        value={formData.status || ''}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Planning">Planning</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="On Hold">On Hold</option>
                      </select>
                    ) : (
                      <p className="text-gray-900">{project.status}</p>
                    )}
                  </div>
                </div>

                {/* Scope and Workflow */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Scope
                    </label>
                    {editing ? (
                      <select
                        value={formData.scope || ''}
                        onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Fitout">Fitout</option>
                        <option value="Refurbishment">Refurbishment</option>
                        <option value="Maintenance">Maintenance</option>
                      </select>
                    ) : (
                      <p className="text-gray-900">{project.scope}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Workflow
                    </label>
                    {editing ? (
                      <select
                        value={formData.workflow || ''}
                        onChange={(e) => setFormData({ ...formData, workflow: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Standard">Standard</option>
                        <option value="Design & Build">Design & Build</option>
                        <option value="Procurement Only">Procurement Only</option>
                      </select>
                    ) : (
                      <p className="text-gray-900">{project.workflow}</p>
                    )}
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.location || ''}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g., Sydney CBD"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{project.location || 'Not specified'}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  {editing ? (
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                      placeholder="Brief description of the project..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  ) : (
                    <p className="text-gray-900 whitespace-pre-wrap">
                      {project.description || 'No description provided'}
                    </p>
                  )}
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    {editing ? (
                      <input
                        type="date"
                        value={formatDateForInput(formData.startDate)}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900 flex items-center gap-2">
                        <Calendar size={16} />
                        {formatDate(project.startDate)}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    {editing ? (
                      <input
                        type="date"
                        value={formatDateForInput(formData.endDate)}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900 flex items-center gap-2">
                        <Calendar size={16} />
                        {formatDate(project.endDate)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Budget & Spending Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold mb-6">Budget & Spending</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Budget
                  </label>
                  {editing ? (
                    <input
                      type="number"
                      value={formData.budget || 0}
                      onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-3xl font-bold text-gray-900">
                      {formatCurrency(project.budget)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Spent
                  </label>
                  {editing ? (
                    <input
                      type="number"
                      value={formData.spent || 0}
                      onChange={(e) => setFormData({ ...formData, spent: Number(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-3xl font-bold text-gray-900">
                      {formatCurrency(project.spent)}
                    </p>
                  )}
                </div>
              </div>

              {/* Budget Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 font-medium">Budget Utilization</span>
                  <span className="font-bold text-gray-900">
                    {budgetUtilization.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className={`h-4 rounded-full transition-all ${
                      budgetUtilization >= 100
                        ? 'bg-red-500'
                        : budgetUtilization >= 75
                        ? 'bg-orange-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(budgetUtilization, 100)}%` }}
                  />
                </div>
              </div>

              {/* Remaining Budget */}
              <div className={`p-4 rounded-lg ${
                remaining < 0 ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'
              }`}>
                <p className="text-sm font-medium text-gray-700 mb-1">
                  {remaining < 0 ? 'Over Budget' : 'Remaining Budget'}
                </p>
                <p className={`text-2xl font-bold ${
                  remaining < 0 ? 'text-red-700' : 'text-green-700'
                }`}>
                  {formatCurrency(Math.abs(remaining))}
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar - Right Side */}
          <div className="space-y-6">
            {/* Project Info Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-bold text-lg mb-4">Project Information</h3>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Project Code
                  </p>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.projectCode || ''}
                      onChange={(e) => setFormData({ ...formData, projectCode: e.target.value })}
                      placeholder="e.g., WFC-L2-2024"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="font-medium text-gray-900">{project.projectCode || 'Not set'}</p>
                  )}
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Created By
                  </p>
                  <p className="font-medium text-gray-900">{project.userId.name}</p>
                  <p className="text-sm text-gray-500">{project.userId.email}</p>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Created On
                  </p>
                  <p className="font-medium text-gray-900">
                    {formatDate(project.createdAt)}
                  </p>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Last Updated
                  </p>
                  <p className="font-medium text-gray-900">
                    {formatDate(project.updatedAt)}
                  </p>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Created By Role
                  </p>
                  <p className="font-medium text-gray-900 capitalize">{project.createdBy}</p>
                </div>
              </div>
            </div>

            {/* Quick Stats Card */}
            <div className=" from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-6">
              <h3 className="font-bold text-lg mb-4 text-blue-900">Quick Stats</h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-800">Budget Status</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    budgetUtilization >= 100
                      ? 'bg-red-100 text-red-700'
                      : budgetUtilization >= 75
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {budgetUtilization >= 100
                      ? 'Over Budget'
                      : budgetUtilization >= 75
                      ? 'High Usage'
                      : 'On Track'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-800">Project Duration</span>
                  <span className="font-medium text-blue-900">
                    {project.startDate && project.endDate
                      ? Math.ceil(
                          (new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) /
                            (1000 * 60 * 60 * 24)
                        ) + ' days'
                      : 'Not set'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-800">Daily Budget</span>
                  <span className="font-medium text-blue-900">
                    {project.startDate && project.endDate
                      ? formatCurrency(
                          project.budget /
                            Math.ceil(
                              (new Date(project.endDate).getTime() -
                                new Date(project.startDate).getTime()) /
                                (1000 * 60 * 60 * 24)
                            )
                        )
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}