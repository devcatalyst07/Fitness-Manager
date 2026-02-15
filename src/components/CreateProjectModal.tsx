import React, { useState, useEffect } from 'react';
import { X, Plus, AlertTriangle, Calendar } from 'lucide-react';
import { apiClient } from '@/lib/axios';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Brand {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

interface Workflow {
  _id: string;
  name: string;
  description?: string;
}

interface Scope {
  _id: string;
  name: string;
  description?: string;
  workflows: Workflow[];
}

export function CreateProjectModal({ isOpen, onClose, onSuccess }: CreateProjectModalProps) {
  const [formData, setFormData] = useState({
    projectName: '',
    brand: '',
    scope: '',
    workflow: '',
    projectCode: '',
    description: '',
    location: '',
    region: '',
    scheduleFrom: 'start' as 'start' | 'end',
    startDate: '',
    endDate: '',
    budget: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [brands, setBrands] = useState<Brand[]>([]);
  const [scopes, setScopes] = useState<Scope[]>([]);
  const [availableWorkflows, setAvailableWorkflows] = useState<Workflow[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [loadingScopes, setLoadingScopes] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchBrands();
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.brand) {
      fetchScopesForBrand(formData.brand);
    } else {
      setScopes([]);
      setAvailableWorkflows([]);
      setFormData(prev => ({ ...prev, scope: '', workflow: '' }));
    }
  }, [formData.brand]);

  useEffect(() => {
    if (formData.scope) {
      const selectedScope = scopes.find(s => s.name === formData.scope);
      if (selectedScope) {
        setAvailableWorkflows(selectedScope.workflows);
        if (selectedScope.workflows.length > 0 && !formData.workflow) {
          setFormData(prev => ({ 
            ...prev, 
            workflow: selectedScope.workflows[0].name 
          }));
        }
      } else {
        setAvailableWorkflows([]);
      }
    } else {
      setAvailableWorkflows([]);
      setFormData(prev => ({ ...prev, workflow: '' }));
    }
  }, [formData.scope, scopes]);

  // ✅ FIXED: Use apiClient instead of localStorage token + fetch
  const fetchBrands = async () => {
    try {
      const data = await apiClient.get('/api/brands');
      setBrands(data);
      if (data.length > 0 && !formData.brand) {
        setFormData(prev => ({ ...prev, brand: data[0].name }));
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
    } finally {
      setLoadingBrands(false);
    }
  };

  // ✅ FIXED: Use apiClient instead of localStorage token + fetch
  const fetchScopesForBrand = async (brandName: string) => {
    setLoadingScopes(true);
    try {
      const data = await apiClient.get(`/api/scopes/for-brand/${encodeURIComponent(brandName)}`);
      setScopes(data);
      if (data.length > 0 && !formData.scope) {
        setFormData(prev => ({ ...prev, scope: data[0].name }));
      }
    } catch (error) {
      console.error('Error fetching scopes:', error);
    } finally {
      setLoadingScopes(false);
    }
  };

  if (!isOpen) return null;

  // ✅ FIXED: Use apiClient instead of localStorage token + fetch
  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    if (!formData.projectName) {
      setError('Project name is required');
      setLoading(false);
      return;
    }

    if (!formData.brand) {
      setError('Brand is required');
      setLoading(false);
      return;
    }

    if (!formData.scope) {
      setError('Scope is required');
      setLoading(false);
      return;
    }

    if (!formData.workflow) {
      setError('Workflow is required');
      setLoading(false);
      return;
    }

    if (formData.scheduleFrom === 'start' && !formData.startDate) {
      setError('Start date is required when scheduling from start');
      setLoading(false);
      return;
    }

    if (formData.scheduleFrom === 'end' && !formData.endDate) {
      setError('End date is required when scheduling from end');
      setLoading(false);
      return;
    }

    try {
      const data = await apiClient.post('/api/projects', {
        ...formData,
        budget: parseFloat(formData.budget) || 0,
      });

      // Show risk warning if applicable
      if (data.project?.isAtRisk) {
        alert(`⚠️ Project created but flagged as AT RISK:\n${data.project.riskReason}`);
      }

      onSuccess();
      onClose();
      setFormData({
        projectName: '',
        brand: '',
        scope: '',
        workflow: '',
        projectCode: '',
        description: '',
        location: '',
        region: '',
        scheduleFrom: 'start',
        startDate: '',
        endDate: '',
        budget: '',
      });
    } catch (err: any) {
      console.error('Create project error:', err);
      setError(err?.response?.data?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-lg rounded-lg relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-black transition-colors z-10"
        >
          <X size={24} />
        </button>

        <div className="p-8">
          <div className="flex items-center mb-2">
            <Plus size={24} className="mr-2" />
            <h2 className="text-2xl font-bold text-black">Create New Project</h2>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            Create a new fitout project with automatic task scheduling
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm flex items-start gap-2">
              <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.projectName}
                onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                placeholder="e.g., Westfield Shopping Center - Level 2 Renovation"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand <span className="text-red-500">*</span>
              </label>
              {loadingBrands ? (
                <div className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-500">
                  Loading brands...
                </div>
              ) : brands.length === 0 ? (
                <div className="w-full px-4 py-2 border border-red-300 rounded-lg text-red-600 bg-red-50">
                  No brands available. Please create a brand first in the Dashboard.
                </div>
              ) : (
                <select
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select Brand --</option>
                  {brands.map((brand) => (
                    <option key={brand._id} value={brand.name}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Scope <span className="text-red-500">*</span>
              </label>
              {loadingScopes ? (
                <div className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-500">
                  Loading scopes...
                </div>
              ) : !formData.brand ? (
                <div className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-500 bg-gray-50">
                  Please select a brand first
                </div>
              ) : scopes.length === 0 ? (
                <div className="w-full px-4 py-2 border border-yellow-300 rounded-lg text-yellow-700 bg-yellow-50">
                  No scopes available for this brand. Please create a scope in Dashboard → Scope & Workflow Architecture.
                </div>
              ) : (
                <select
                  value={formData.scope}
                  onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select Scope --</option>
                  {scopes.map((scope) => (
                    <option key={scope._id} value={scope.name}>
                      {scope.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Workflow <span className="text-red-500">*</span>
              </label>
              {!formData.scope ? (
                <div className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-500 bg-gray-50">
                  Please select a scope first
                </div>
              ) : availableWorkflows.length === 0 ? (
                <div className="w-full px-4 py-2 border border-yellow-300 rounded-lg text-yellow-700 bg-yellow-50">
                  No workflows available for this scope. Please add workflows in Dashboard → Scope & Workflow Architecture.
                </div>
              ) : (
                <select
                  value={formData.workflow}
                  onChange={(e) => setFormData({ ...formData, workflow: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select Workflow --</option>
                  {availableWorkflows.map((workflow) => (
                    <option key={workflow._id} value={workflow.name}>
                      {workflow.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Schedule From Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                <Calendar size={16} className="inline mr-2" />
                Schedule From <span className="text-red-500">*</span>
              </label>
              
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="scheduleFrom"
                    value="start"
                    checked={formData.scheduleFrom === 'start'}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      scheduleFrom: 'start',
                      endDate: ''
                    })}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Start Date</div>
                    <div className="text-xs text-gray-600 mt-1">
                      Project will be scheduled forward from the start date. End date will be calculated automatically.
                    </div>
                    {formData.scheduleFrom === 'start' && (
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="scheduleFrom"
                    value="end"
                    checked={formData.scheduleFrom === 'end'}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      scheduleFrom: 'end',
                      startDate: ''
                    })}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">End Date</div>
                    <div className="text-xs text-gray-600 mt-1">
                      Project will be scheduled backward from the end date. Start date will be calculated automatically.
                    </div>
                    {formData.scheduleFrom === 'end' && (
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                  </div>
                </label>
              </div>

              {formData.scheduleFrom === 'end' && (
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                  If the end date is not achievable, the project will be created and flagged as &quot;At risk&quot;
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Code (Optional)
              </label>
              <input
                type="text"
                value={formData.projectCode}
                onChange={(e) => setFormData({ ...formData, projectCode: e.target.value })}
                placeholder="e.g., WFC-L2-2024"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Sydney CBD"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Region
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                placeholder="e.g., NSW, Victoria"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Budget ($)
              </label>
              <input
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                placeholder="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the project scope and objectives..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || brands.length === 0 || scopes.length === 0}
              className="flex-1 px-4 py-3 bg-black text-white hover:bg-gray-800 rounded-lg transition-colors disabled:bg-gray-400"
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}