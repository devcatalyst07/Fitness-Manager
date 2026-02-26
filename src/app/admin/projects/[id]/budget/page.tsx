'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Plus, X, Edit, Trash2, Link2, ArrowUpDown, Download } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/axios';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import FitoutLoadingSpinner from '@/components/FitoutLoadingSpinner';

// ─── Types ──────────────────────────────────────────────────────

interface BudgetItem {
  _id: string;
  description: string;
  category: string;
  vendor?: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  committedStatus: string;
  invoicedAmount?: number;
  paidAmount?: number;
  notes?: string;
  // ★ Tender sync fields
  tenderId?: string;
  tenderNumber?: string;
  awardedBidId?: string;
  isTenderSynced?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProjectFinance {
  totalBudget: number;
  committed: number;
  invoiced: number;
  paid: number;
  remaining: number;
}

// ─── Component ──────────────────────────────────────────────────

export default function AdminProjectBudgetPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();

  const [pathname, setPathname] = useState('/admin/projects');
  const [loading, setLoading] = useState(true);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [projectName, setProjectName] = useState('');
  const [projectFinance, setProjectFinance] = useState<ProjectFinance>({
    totalBudget: 0, committed: 0, invoiced: 0, paid: 0, remaining: 0,
  });

  // ── Modal state ──
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);

  // ── Form state ──
  const [formData, setFormData] = useState({
    description: '',
    category: 'Construction',
    vendor: '',
    quantity: 1,
    unitCost: 0,
    committedStatus: 'Pending',
    invoicedAmount: 0,
    paidAmount: 0,
    notes: '',
  });

  // ── Sorting & filtering ──
  const [sortField, setSortField] = useState<string>('category');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const [saving, setSaving] = useState(false);

  // ── Auth guards ──
  useEffect(() => {
    if (!authLoading && !user) { router.replace('/'); return; }
    if (!authLoading && user && user.role !== 'admin') { router.replace('/user/projects'); return; }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.role === 'admin' && params.id) {
      fetchProject();
      fetchBudgetItems();
    }
  }, [user, params.id]);

  // ── Data fetching ──

  const fetchProject = async () => {
    try {
      const data = await apiClient.get(`/api/projects/${params.id}`);
      setProjectName(data.projectName);
      setProjectFinance({
        totalBudget: data.totalBudget || data.budget || 0,
        committed: data.committed || 0,
        invoiced: data.invoiced || 0,
        paid: data.paid || 0,
        remaining: (data.totalBudget || data.budget || 0) - (data.committed || 0),
      });
    } catch (error) { console.error('Error fetching project:', error); }
  };

  const fetchBudgetItems = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get(`/api/projects/${params.id}/budget`);
      setBudgetItems(data);
      recalculateFinance(data);
    } catch (error) { console.error('Error fetching budget:', error); }
    finally { setLoading(false); }
  };

  const recalculateFinance = (items: BudgetItem[]) => {
    const committed = items
      .filter((i) => i.committedStatus === 'Committed')
      .reduce((sum, i) => sum + (i.totalCost || i.quantity * i.unitCost), 0);
    const invoiced = items.reduce((sum, i) => sum + (i.invoicedAmount || 0), 0);
    const paid = items.reduce((sum, i) => sum + (i.paidAmount || 0), 0);

    setProjectFinance((prev) => ({
      ...prev,
      committed,
      invoiced,
      paid,
      remaining: prev.totalBudget - committed,
    }));
  };

  // ── CRUD ──

  const handleAddItem = async () => {
    if (!formData.description.trim() || !formData.unitCost) {
      alert('Please fill in Description and Unit Cost');
      return;
    }
    setSaving(true);
    try {
      await apiClient.post(`/api/projects/${params.id}/budget`, {
        ...formData,
        totalCost: formData.quantity * formData.unitCost,
      });
      await fetchBudgetItems();
      closeAddModal();
      alert('Budget item added!');
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Failed to add budget item');
    } finally { setSaving(false); }
  };

  const handleUpdateItem = async () => {
    if (!editingItem) return;
    if (!formData.description.trim() || !formData.unitCost) {
      alert('Please fill in Description and Unit Cost');
      return;
    }
    setSaving(true);
    try {
      await apiClient.put(`/api/budget/${editingItem._id}`, {
        ...formData,
        totalCost: formData.quantity * formData.unitCost,
      });
      await fetchBudgetItems();
      closeEditModal();
      alert('Budget item updated!');
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Failed to update budget item');
    } finally { setSaving(false); }
  };

  const handleDeleteItem = async (itemId: string, isTenderSynced?: boolean) => {
    if (isTenderSynced) {
      alert('This item was auto-created from a Tender award and cannot be deleted. To remove it, cancel the tender award first.');
      return;
    }
    if (!confirm('Delete this budget item?')) return;
    try {
      await apiClient.delete(`/api/budget/${itemId}`);
      await fetchBudgetItems();
      alert('Budget item deleted.');
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Failed to delete');
    }
  };

  // ── Modal helpers ──

  const openEditModal = (item: BudgetItem) => {
    setEditingItem(item);
    setFormData({
      description: item.description,
      category: item.category,
      vendor: item.vendor || '',
      quantity: item.quantity,
      unitCost: item.unitCost,
      committedStatus: item.committedStatus,
      invoicedAmount: item.invoicedAmount || 0,
      paidAmount: item.paidAmount || 0,
      notes: item.notes || '',
    });
    setIsEditModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    resetForm();
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingItem(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      description: '', category: 'Construction', vendor: '', quantity: 1,
      unitCost: 0, committedStatus: 'Pending', invoicedAmount: 0, paidAmount: 0, notes: '',
    });
  };

  // ── Sorting ──

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // ── Formatters ──

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      Pending: 'bg-gray-100 text-gray-700',
      Committed: 'bg-blue-100 text-blue-700',
      Invoiced: 'bg-yellow-100 text-yellow-700',
      Paid: 'bg-green-100 text-green-700',
      Cancelled: 'bg-red-100 text-red-700',
    };
    return badges[status] || 'bg-gray-100 text-gray-700';
  };

  // ── Computed data ──

  const categories = ['All', ...new Set(budgetItems.map((i) => i.category))];
  const statuses = ['All', 'Pending', 'Committed', 'Invoiced', 'Paid', 'Cancelled'];

  const filteredItems = budgetItems
    .filter((item) => {
      if (filterCategory !== 'All' && item.category !== filterCategory) return false;
      if (filterStatus !== 'All' && item.committedStatus !== filterStatus) return false;
      if (searchQuery && !item.description.toLowerCase().includes(searchQuery.toLowerCase()) && !(item.vendor || '').toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      let aVal: any = (a as any)[sortField];
      let bVal: any = (b as any)[sortField];
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  const filteredTotal = filteredItems.reduce((sum, i) => sum + (i.totalCost || i.quantity * i.unitCost), 0);
  const tenderSyncedCount = budgetItems.filter((i) => i.isTenderSynced).length;
  const tenderSyncedTotal = budgetItems.filter((i) => i.isTenderSynced).reduce((sum, i) => sum + (i.totalCost || 0), 0);

  const budgetUtilization = projectFinance.totalBudget > 0
    ? ((projectFinance.committed / projectFinance.totalBudget) * 100).toFixed(1)
    : '0';

  if (authLoading || loading) return <FitoutLoadingSpinner />;
  if (!user || user.role !== 'admin') return <FitoutLoadingSpinner />;

  // ═══════════════════════════════════════════════════════════
  // FORM RENDER (shared between Add & Edit)
  // ═══════════════════════════════════════════════════════════

  const renderForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">Description *</label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="e.g., Main Construction Works"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
          >
            {['Construction', 'Design', 'Joinery', 'MEP', 'Fixtures', 'Contingency', 'Professional Fees', 'Other'].map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Vendor</label>
          <input
            type="text"
            value={formData.vendor}
            onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="Contractor / vendor name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Quantity</label>
          <input
            type="number"
            min="1"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Unit Cost *</label>
          <input
            type="number"
            min="0"
            value={formData.unitCost || ''}
            onChange={(e) => setFormData({ ...formData, unitCost: parseFloat(e.target.value) || 0 })}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="0"
          />
        </div>

        <div className="col-span-2 bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-sm text-gray-500">Total Cost</div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(formData.quantity * formData.unitCost)}</div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            value={formData.committedStatus}
            onChange={(e) => setFormData({ ...formData, committedStatus: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
          >
            {['Pending', 'Committed', 'Invoiced', 'Paid', 'Cancelled'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Invoiced Amount</label>
          <input
            type="number"
            min="0"
            value={formData.invoicedAmount || ''}
            onChange={(e) => setFormData({ ...formData, invoicedAmount: parseFloat(e.target.value) || 0 })}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Paid Amount</label>
          <input
            type="number"
            min="0"
            value={formData.paidAmount || ''}
            onChange={(e) => setFormData({ ...formData, paidAmount: parseFloat(e.target.value) || 0 })}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={2}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="Optional notes"
          />
        </div>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar pathname={pathname} setPathname={setPathname} />
      <AdminHeader />

      <main className="lg:ml-64 mt-16 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push(`/admin/projects/${params.id}`)}
            className="text-gray-600 hover:text-black mb-4 flex items-center gap-2 text-sm"
          >
            ← {projectName || 'Back to Project'}
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Budget Management</h1>
              <p className="text-sm text-gray-600">Track costs, commitments, and tender-synced items</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { resetForm(); setIsAddModalOpen(true); }}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
              >
                <Plus size={18} />
                Add Budget Item
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-6">
            {['Overview', 'Tasks', 'Budget', 'Tender', 'Documents', 'Team'].map((tab) => (
              <button
                key={tab}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                  tab === 'Budget' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => {
                  if (tab === 'Overview') router.push(`/admin/projects/${params.id}`);
                  if (tab === 'Tasks') router.push(`/admin/projects/${params.id}/tasks`);
                  if (tab === 'Tender') router.push(`/admin/projects/${params.id}/tender`);
                  if (tab === 'Documents') router.push(`/admin/projects/${params.id}/documents`);
                  if (tab === 'Team') router.push(`/admin/projects/${params.id}/team`);
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Total Budget</div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(projectFinance.totalBudget)}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Committed</div>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(projectFinance.committed)}</div>
            <div className="text-xs text-gray-500 mt-1">{budgetUtilization}% of budget</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Invoiced</div>
            <div className="text-2xl font-bold text-yellow-600">{formatCurrency(projectFinance.invoiced)}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Paid</div>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(projectFinance.paid)}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Remaining</div>
            <div className={`text-2xl font-bold ${projectFinance.remaining >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
              {formatCurrency(projectFinance.remaining)}
            </div>
          </div>
        </div>

        {/* Budget Utilization Bar */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Budget Utilization</span>
            <span className="text-sm text-gray-500">{budgetUtilization}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${
                parseFloat(budgetUtilization) > 100 ? 'bg-red-500' :
                parseFloat(budgetUtilization) > 80 ? 'bg-yellow-500' : 'bg-blue-600'
              }`}
              style={{ width: `${Math.min(parseFloat(budgetUtilization), 100)}%` }}
            />
          </div>
          {tenderSyncedCount > 0 && (
            <div className="mt-3 flex items-center gap-2 text-sm text-blue-700 bg-blue-50 rounded-lg p-2">
              <Link2 size={14} />
              <span>
                {tenderSyncedCount} item{tenderSyncedCount > 1 ? 's' : ''} auto-synced from Tender awards ({formatCurrency(tenderSyncedTotal)})
              </span>
              <button
                onClick={() => setFilterStatus('Committed')}
                className="ml-auto text-blue-600 hover:text-blue-800 font-medium underline"
              >
                View
              </button>
            </div>
          )}
        </div>

        {/* Filters & Search */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg text-sm"
                placeholder="Search by description or vendor..."
              />
            </div>
            <div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border rounded-lg text-sm"
              >
                {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border rounded-lg text-sm"
              >
                {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="text-sm text-gray-500">
              {filteredItems.length} items — Total: {formatCurrency(filteredTotal)}
            </div>
          </div>
        </div>

        {/* Budget Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {filteredItems.length === 0 ? (
            <div className="p-12 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {budgetItems.length === 0 ? 'No budget items yet' : 'No items match your filters'}
              </h3>
              <p className="text-gray-600 mb-6">
                {budgetItems.length === 0
                  ? 'Add budget items manually or award tenders to auto-populate.'
                  : 'Try adjusting your filters or search query.'}
              </p>
              {budgetItems.length === 0 && (
                <button
                  onClick={() => { resetForm(); setIsAddModalOpen(true); }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add First Budget Item
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => handleSort('description')}>
                      <div className="flex items-center gap-1">Description <ArrowUpDown size={12} /></div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => handleSort('category')}>
                      <div className="flex items-center gap-1">Category <ArrowUpDown size={12} /></div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => handleSort('unitCost')}>
                      <div className="flex items-center justify-end gap-1">Unit Cost <ArrowUpDown size={12} /></div>
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => handleSort('totalCost')}>
                      <div className="flex items-center justify-end gap-1">Total <ArrowUpDown size={12} /></div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Invoiced</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Paid</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredItems.map((item) => {
                    const total = item.totalCost || item.quantity * item.unitCost;
                    return (
                      <tr key={item._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900 text-sm">{item.description}</div>
                          {item.notes && <div className="text-xs text-gray-500 truncate max-w-[200px]">{item.notes}</div>}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.category}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.vendor || '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.quantity}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">{formatCurrency(item.unitCost)}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">{formatCurrency(total)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(item.committedStatus)}`}>
                            {item.committedStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">{formatCurrency(item.invoicedAmount || 0)}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">{formatCurrency(item.paidAmount || 0)}</td>
                        <td className="px-4 py-3">
                          {item.isTenderSynced ? (
                            <button
                              onClick={() => router.push(`/admin/projects/${params.id}/tender`)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium hover:bg-blue-100"
                            >
                              <Link2 size={12} />
                              {item.tenderNumber || 'Tender'}
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">Manual</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(item)}
                              className="text-gray-600 hover:text-gray-800"
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item._id, item.isTenderSynced)}
                              className={`${item.isTenderSynced ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-red-600'}`}
                              title={item.isTenderSynced ? 'Tender-synced items cannot be deleted' : 'Delete'}
                              disabled={item.isTenderSynced}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                  <tr>
                    <td colSpan={5} className="px-4 py-3 font-bold text-gray-900 text-sm">Total ({filteredItems.length} items)</td>
                    <td className="px-4 py-3 font-bold text-gray-900 text-right text-sm">{formatCurrency(filteredTotal)}</td>
                    <td className="px-4 py-3"></td>
                    <td className="px-4 py-3 font-bold text-gray-900 text-right text-sm">
                      {formatCurrency(filteredItems.reduce((sum, i) => sum + (i.invoicedAmount || 0), 0))}
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-900 text-right text-sm">
                      {formatCurrency(filteredItems.reduce((sum, i) => sum + (i.paidAmount || 0), 0))}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Category Summary */}
        {budgetItems.length > 0 && (
          <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...new Set(budgetItems.map((i) => i.category))].map((cat) => {
                const catItems = budgetItems.filter((i) => i.category === cat);
                const catTotal = catItems.reduce((sum, i) => sum + (i.totalCost || i.quantity * i.unitCost), 0);
                const catPercent = projectFinance.totalBudget > 0 ? ((catTotal / projectFinance.totalBudget) * 100).toFixed(1) : '0';
                const catTenderCount = catItems.filter((i) => i.isTenderSynced).length;

                return (
                  <div key={cat} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">{cat}</span>
                      <span className="text-xs text-gray-500">{catItems.length} items</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900">{formatCurrency(catTotal)}</div>
                    <div className="text-xs text-gray-500 mt-1">{catPercent}% of budget</div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                      <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${Math.min(parseFloat(catPercent), 100)}%` }} />
                    </div>
                    {catTenderCount > 0 && (
                      <div className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                        <Link2 size={10} /> {catTenderCount} from tender
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ ADD BUDGET ITEM MODAL ═══ */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-2xl rounded-lg max-h-[90vh] overflow-y-auto">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Add Budget Item</h2>
                  <button onClick={closeAddModal} className="text-gray-400 hover:text-black">
                    <X size={24} />
                  </button>
                </div>

                {renderForm()}

                <div className="flex gap-3 mt-6">
                  <button onClick={closeAddModal} className="flex-1 px-4 py-3 border rounded-lg hover:bg-gray-50">Cancel</button>
                  <button
                    onClick={handleAddItem}
                    disabled={saving}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {saving ? 'Adding...' : 'Add Item'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ EDIT BUDGET ITEM MODAL ═══ */}
        {isEditModalOpen && editingItem && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-2xl rounded-lg max-h-[90vh] overflow-y-auto">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">Edit Budget Item</h2>
                    {editingItem.isTenderSynced && (
                      <div className="flex items-center gap-2 mt-1 text-sm text-blue-600">
                        <Link2 size={14} />
                        <span>Auto-synced from Tender {editingItem.tenderNumber}</span>
                      </div>
                    )}
                  </div>
                  <button onClick={closeEditModal} className="text-gray-400 hover:text-black">
                    <X size={24} />
                  </button>
                </div>

                {editingItem.isTenderSynced && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-blue-800">
                      This item was automatically created from a tender award. You can update invoiced/paid amounts and notes,
                      but the description, vendor, and total amount are linked to the awarded tender.
                    </p>
                  </div>
                )}

                {renderForm()}

                <div className="flex gap-3 mt-6">
                  <button onClick={closeEditModal} className="flex-1 px-4 py-3 border rounded-lg hover:bg-gray-50">Cancel</button>
                  <button
                    onClick={handleUpdateItem}
                    disabled={saving}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}