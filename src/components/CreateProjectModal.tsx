import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://fitout-manager-api.vercel.app';

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

export function CreateProjectModal({ isOpen, onClose, onSuccess }: CreateProjectModalProps) {
  const [formData, setFormData] = useState({
    projectName: '',
    brand: '',
    scope: 'Fitout',
    workflow: 'Standard',
    projectCode: '',
    description: '',
    location: '',
    startDate: '',
    endDate: '',
    budget: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchBrands();
    }
  }, [isOpen]);

  const fetchBrands = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/brands`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBrands(data);
        // Set first brand as default if available
        if (data.length > 0 && !formData.brand) {
          setFormData(prev => ({ ...prev, brand: data[0].name }));
        }
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
    } finally {
      setLoadingBrands(false);
    }
  };

  if (!isOpen) return null;

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

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          budget: parseFloat(formData.budget) || 0,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to create project');
        setLoading(false);
        return;
      }

      onSuccess();
      onClose();
      setFormData({
        projectName: '',
        brand: '',
        scope: 'Fitout',
        workflow: 'Standard',
        projectCode: '',
        description: '',
        location: '',
        startDate: '',
        endDate: '',
        budget: '',
      });
    } catch (err) {
      console.error('Create project error:', err);
      setError('Failed to create project');
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
            Create a new fitout project to start managing budgets, RFQs, and approvals.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
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
              <select
                value={formData.scope}
                onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Fitout">Fitout</option>
                <option value="Refurbishment">Refurbishment</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Workflow <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.workflow}
                onChange={(e) => setFormData({ ...formData, workflow: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Standard">Standard</option>
                <option value="Design & Build">Design & Build</option>
                <option value="Procurement Only">Procurement Only</option>
              </select>
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
              <p className="text-xs text-gray-500 mt-1">A unique identifier for internal tracking</p>
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
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
              disabled={loading || brands.length === 0}
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