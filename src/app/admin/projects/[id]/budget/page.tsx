'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, FileDown, ChevronDown, ChevronUp, Plus, X, Edit } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/axios';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import FitoutLoadingSpinner from '@/components/FitoutLoadingSpinner';

interface BudgetItem {
  _id: string;
  description: string;
  vendor: string;
  quantity: number;
  unitCost: number;
  committedStatus: 'Paid' | 'Invoiced' | 'Committed' | 'Planned';
  category: string;
}

interface CategoryData {
  category: string;
  items: BudgetItem[];
  totalSpent: number;
  itemCount: number;
  expanded: boolean;
}

interface BudgetStats {
  totalBudget: number;
  totalCommitted: number;
  eac: number;
  variance: number;
  percentUsed: number;
}

export default function ProjectBudgetPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();

  const [pathname, setPathname] = useState('/admin/projects');
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [stats, setStats] = useState<BudgetStats | null>(null);
  const [projectName, setProjectName] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<BudgetItem | null>(null);
  const [formData, setFormData] = useState({
    description: '',
    vendor: '',
    quantity: 1,
    unitCost: 0,
    committedStatus: 'Planned',
    category: 'Design'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) { router.replace('/'); return; }
    if (!authLoading && user && user.role !== 'admin') { router.replace('/user/projects'); return; }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.role === 'admin' && params.id) {
      fetchProject();
      fetchBudget();
      fetchStats();
    }
  }, [user, params.id]);

  const fetchProject = async () => {
    try {
      const data = await apiClient.get(`/api/projects/${params.id}`);
      setProjectName(data.projectName);
    } catch (error) { console.error('Error fetching project:', error); }
  };

  const fetchBudget = async () => {
    try {
      const data = await apiClient.get(`/api/projects/${params.id}/budget`);
      setCategories(data.map((cat: any) => ({ ...cat, expanded: false })));
    } catch (error) { console.error('Error fetching budget:', error); }
    finally { setLoading(false); }
  };

  const fetchStats = async () => {
    try {
      const data = await apiClient.get(`/api/projects/${params.id}/budget/stats`);
      setStats(data);
    } catch (error) { console.error('Error fetching budget stats:', error); }
  };

  const handleCreateBudgetItem = async () => {
    if (!formData.description || !formData.vendor) { alert('Please fill in all required fields'); return; }
    setSaving(true);
    try {
      await apiClient.post(`/api/projects/${params.id}/budget`, formData);
      await fetchBudget();
      await fetchStats();
      setIsCreateModalOpen(false);
      setFormData({ description: '', vendor: '', quantity: 1, unitCost: 0, committedStatus: 'Planned', category: 'Design' });
      alert('Budget item created successfully!');
    } catch (error: any) {
      console.error('Create budget item error:', error);
      alert(error?.response?.data?.message || 'Failed to create budget item');
    } finally { setSaving(false); }
  };

  const handleEditItem = (item: BudgetItem) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  };

  const handleUpdateBudgetItem = async () => {
    if (!selectedItem) return;
    setSaving(true);
    try {
      await apiClient.put(`/api/projects/${params.id}/budget/${selectedItem._id}`, selectedItem);
      await fetchBudget();
      await fetchStats();
      setIsEditModalOpen(false);
      setSelectedItem(null);
      alert('Budget item updated successfully!');
    } catch (error: any) {
      console.error('Update budget item error:', error);
      alert(error?.response?.data?.message || 'Failed to update budget item');
    } finally { setSaving(false); }
  };

  const handleDeleteBudgetItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this budget item?')) return;
    try {
      await apiClient.delete(`/api/projects/${params.id}/budget/${itemId}`);
      await fetchBudget();
      await fetchStats();
      alert('Budget item deleted successfully!');
    } catch (error) { console.error('Delete budget item error:', error); alert('Failed to delete budget item'); }
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);

  const toggleCategory = (index: number) => {
    const newCategories = [...categories];
    newCategories[index].expanded = !newCategories[index].expanded;
    setCategories(newCategories);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-700';
      case 'Invoiced': return 'bg-blue-100 text-blue-700';
      case 'Committed': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const expandAll = () => setCategories(categories.map(cat => ({ ...cat, expanded: true })));
  const collapseAll = () => setCategories(categories.map(cat => ({ ...cat, expanded: false })));

  if (authLoading || loading) return <FitoutLoadingSpinner />;
  if (!user || user.role !== 'admin') return <FitoutLoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar pathname={pathname} setPathname={setPathname} />
      <AdminHeader />

      <main className="lg:ml-64 mt-16 p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <button onClick={() => router.push(`/admin/projects/${params.id}`)} className="text-gray-600 hover:text-black mb-4 flex items-center gap-2">
            <ArrowLeft size={20} />
            <span>{projectName || 'Back to Project'}</span>
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Budget</h1>
              <p className="text-sm text-gray-600">Budget management and tracking</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                <Plus size={18} /><span>Add Item</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                <FileDown size={18} /><span>Export CSV</span>
              </button>
            </div>
          </div>
        </div>

       <div className="mb-6 border-b border-gray-200">
  <div className="flex gap-6">
    {['Overview', 'Tasks', 'Budget', 'Tender', 'Documents', 'Team'].map((tab) => (
      <button key={tab}
        className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${tab === 'Budget' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        onClick={() => {
          if (tab === 'Overview') router.push(`/admin/projects/${params.id}`);
          if (tab === 'Tasks') router.push(`/admin/projects/${params.id}/tasks`);
          if (tab === 'Tender') router.push(`/admin/projects/${params.id}/tender`);
          if (tab === 'Documents') router.push(`/admin/projects/${params.id}/documents`);
          if (tab === 'Team') router.push(`/admin/projects/${params.id}/team`);
        }}
      >{tab}</button>
    ))}
  </div>
</div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Budget Cap</h3>
              <p className="text-3xl font-bold text-blue-700">{formatCurrency(stats.totalBudget)}</p>
            </div>
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Committed</h3>
              <p className="text-3xl font-bold text-green-700">{formatCurrency(stats.totalCommitted)}</p>
            </div>
            <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">EAC</h3>
              <p className="text-3xl font-bold text-orange-700">{formatCurrency(stats.eac)}</p>
              <p className="text-xs text-gray-600 mt-1">Estimated at Completion</p>
            </div>
            <div className={`border-2 rounded-lg p-6 ${stats.variance < 0 ? 'bg-red-50 border-red-200' : 'bg-purple-50 border-purple-200'}`}>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Variance</h3>
              <p className={`text-3xl font-bold ${stats.variance < 0 ? 'text-red-700' : 'text-purple-700'}`}>{formatCurrency(stats.variance)}</p>
              <p className="text-xs text-gray-600 mt-1">{stats.variance < 0 ? 'Over Budget' : 'Under Budget'}</p>
            </div>
          </div>
        )}

        <div className="flex gap-3 mb-6 text-black">
          <button onClick={expandAll} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Expand All</button>
          <button onClick={collapseAll} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Collapse All</button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500"><p className="font-semibold mb-2">No budget items yet</p><p className="text-sm">Start by adding your first budget item</p></td></tr>
                ) : categories.map((category, categoryIndex) => (
                  <React.Fragment key={category.category}>
                    <tr className="bg-gray-100 border-t-2 border-gray-300">
                      <td colSpan={7} className="px-6 py-3">
                        <button onClick={() => toggleCategory(categoryIndex)} className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3">
                            {category.expanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                            <span className="font-bold text-gray-900">{category.category}</span>
                            <span className="text-sm text-gray-600">({category.itemCount} items)</span>
                          </div>
                          <span className="font-bold text-gray-900">Total: {formatCurrency(category.totalSpent)}</span>
                        </button>
                      </td>
                    </tr>
                    {category.expanded && category.items.length === 0 && (
                      <tr className="border-b border-gray-200"><td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">No items in this category yet</td></tr>
                    )}
                    {category.expanded && category.items.map((item) => (
                      <tr key={item._id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">{item.description}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{item.vendor}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{item.quantity}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(item.unitCost)}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 font-semibold">{formatCurrency(item.quantity * item.unitCost)}</td>
                        <td className="px-6 py-4"><span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.committedStatus)}`}>{item.committedStatus}</span></td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleEditItem(item)} className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"><Edit size={14} />Edit</button>
                            <button onClick={() => handleDeleteBudgetItem(item._id)} className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
              {stats && (
                <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                  <tr>
                    <td colSpan={4} className="px-6 py-4 font-bold text-gray-900">Project Total</td>
                    <td className="px-6 py-4 font-bold text-gray-900">{formatCurrency(stats.totalCommitted)}</td>
                    <td colSpan={2} className="px-6 py-4"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Create Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-2xl rounded-lg max-h-[90vh] overflow-y-auto">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Add Budget Item</h2>
                  <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-black"><X size={24} /></button>
                </div>
                <div className="space-y-4">
                  <div><label className="block text-sm font-medium mb-1">Category *</label><select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-2 border rounded-lg"><option value="Design">Design</option><option value="Approvals">Approvals</option><option value="Construction">Construction</option><option value="Joinery">Joinery</option><option value="MEP">MEP</option><option value="Fixtures">Fixtures</option><option value="Contingency">Contingency</option><option value="Misc">Misc</option></select></div>
                  <div><label className="block text-sm font-medium mb-1">Description *</label><input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2 border rounded-lg" /></div>
                  <div><label className="block text-sm font-medium mb-1">Vendor *</label><input type="text" value={formData.vendor} onChange={(e) => setFormData({ ...formData, vendor: e.target.value })} className="w-full px-4 py-2 border rounded-lg" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1">Quantity</label><input type="number" min="1" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })} className="w-full px-4 py-2 border rounded-lg" /></div>
                    <div><label className="block text-sm font-medium mb-1">Unit Cost ($)</label><input type="number" min="0" value={formData.unitCost} onChange={(e) => setFormData({ ...formData, unitCost: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-2 border rounded-lg" /></div>
                  </div>
                  <div><label className="block text-sm font-medium mb-1">Status</label><select value={formData.committedStatus} onChange={(e) => setFormData({ ...formData, committedStatus: e.target.value as any })} className="w-full px-4 py-2 border rounded-lg"><option value="Planned">Planned</option><option value="Committed">Committed</option><option value="Invoiced">Invoiced</option><option value="Paid">Paid</option></select></div>
                  <div className="p-4 bg-gray-50 rounded-lg"><div className="flex justify-between text-sm mb-1"><span className="font-medium">Total Cost:</span><span className="font-bold">{formatCurrency(formData.quantity * formData.unitCost)}</span></div></div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setIsCreateModalOpen(false)} className="flex-1 px-4 py-3 border rounded-lg">Cancel</button>
                  <button onClick={handleCreateBudgetItem} disabled={saving} className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg">{saving ? 'Adding...' : 'Add Item'}</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {isEditModalOpen && selectedItem && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-2xl rounded-lg max-h-[90vh] overflow-y-auto">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Edit Budget Item</h2>
                  <button onClick={() => { setIsEditModalOpen(false); setSelectedItem(null); }} className="text-gray-400 hover:text-black"><X size={24} /></button>
                </div>
                <div className="space-y-4">
                  <div><label className="block text-sm font-medium mb-1">Category *</label><select value={selectedItem.category} onChange={(e) => setSelectedItem({ ...selectedItem, category: e.target.value })} className="w-full px-4 py-2 border rounded-lg"><option value="Design">Design</option><option value="Approvals">Approvals</option><option value="Construction">Construction</option><option value="Joinery">Joinery</option><option value="MEP">MEP</option><option value="Fixtures">Fixtures</option><option value="Contingency">Contingency</option><option value="Misc">Misc</option></select></div>
                  <div><label className="block text-sm font-medium mb-1">Description *</label><input type="text" value={selectedItem.description} onChange={(e) => setSelectedItem({ ...selectedItem, description: e.target.value })} className="w-full px-4 py-2 border rounded-lg" /></div>
                  <div><label className="block text-sm font-medium mb-1">Vendor *</label><input type="text" value={selectedItem.vendor} onChange={(e) => setSelectedItem({ ...selectedItem, vendor: e.target.value })} className="w-full px-4 py-2 border rounded-lg" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1">Quantity</label><input type="number" min="1" value={selectedItem.quantity} onChange={(e) => setSelectedItem({ ...selectedItem, quantity: parseInt(e.target.value) || 1 })} className="w-full px-4 py-2 border rounded-lg" /></div>
                    <div><label className="block text-sm font-medium mb-1">Unit Cost ($)</label><input type="number" min="0" value={selectedItem.unitCost} onChange={(e) => setSelectedItem({ ...selectedItem, unitCost: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-2 border rounded-lg" /></div>
                  </div>
                  <div><label className="block text-sm font-medium mb-1">Status</label><select value={selectedItem.committedStatus} onChange={(e) => setSelectedItem({ ...selectedItem, committedStatus: e.target.value as any })} className="w-full px-4 py-2 border rounded-lg"><option value="Planned">Planned</option><option value="Committed">Committed</option><option value="Invoiced">Invoiced</option><option value="Paid">Paid</option></select></div>
                  <div className="p-4 bg-gray-50 rounded-lg"><div className="flex justify-between text-sm mb-1"><span className="font-medium">Total Cost:</span><span className="font-bold">{formatCurrency(selectedItem.quantity * selectedItem.unitCost)}</span></div></div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => { setIsEditModalOpen(false); setSelectedItem(null); }} className="flex-1 px-4 py-3 border rounded-lg">Cancel</button>
                  <button onClick={handleUpdateBudgetItem} disabled={saving} className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg">{saving ? 'Saving...' : 'Save Changes'}</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}