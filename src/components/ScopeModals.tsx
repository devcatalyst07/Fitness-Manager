import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit2, AlertCircle, CheckCircle, Loader, Upload } from 'lucide-react';
import { ExcelUploadModal } from './ExcelUploadModal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://fitout-manager-api.vercel.app';

interface Brand {
  _id: string;
  name: string;
}

interface Scope {
  _id: string;
  name: string;
  description?: string;
  brandFilter: 'all' | 'specific';
  brandId?: string;
  brandName?: string;
  isActive: boolean;
}

interface Phase {
  _id: string;
  name: string;
  description?: string;
  order: number;
  tasks: Task[];
}

interface Task {
  _id: string;
  title: string;
  description?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  estimateHours?: number;
  order: number;
}

interface Workflow {
  _id: string;
  name: string;
  description?: string;
  phases: Phase[];
}

// ==================== CUSTOM ALERT COMPONENTS ====================
interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

function ConfirmDialog({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning'
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: 'bg-red-100 text-red-800 border-red-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  const buttonStyles = {
    danger: 'bg-red-600 hover:bg-red-700',
    warning: 'bg-yellow-600 hover:bg-yellow-700',
    info: 'bg-blue-600 hover:bg-blue-700',
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white w-full max-w-md rounded-lg shadow-xl">
        <div className={`p-4 border-b ${variantStyles[variant]}`}>
          <div className="flex items-center gap-3">
            <AlertCircle size={24} />
            <h3 className="text-lg font-bold">{title}</h3>
          </div>
        </div>
        <div className="p-6">
          <p className="text-gray-700">{message}</p>
        </div>
        <div className="flex gap-3 p-4 bg-gray-50 rounded-b-lg">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg font-medium"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 text-white rounded-lg font-medium ${buttonStyles[variant]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

interface SuccessAlertProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
}

function SuccessAlert({ isOpen, message, onClose }: SuccessAlertProps) {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(onClose, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60] p-4">
      <div className="bg-white w-full max-w-sm rounded-lg shadow-xl p-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center gap-3 text-green-600">
          <CheckCircle size={28} className="flex-shrink-0" />
          <p className="text-gray-900 font-medium">{message}</p>
        </div>
      </div>
    </div>
  );
}

// ==================== TASK FORM MODAL ====================
interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: Partial<Task>) => void;
  loading?: boolean;
}

function TaskFormModal({ isOpen, onClose, onSubmit, loading }: TaskFormModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Medium' as Task['priority'],
    estimateHours: '',
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title: formData.title,
      description: formData.description || undefined,
      priority: formData.priority,
      estimateHours: formData.estimateHours ? parseInt(formData.estimateHours) : undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white w-full max-w-md rounded-lg shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-bold text-gray-900">Add New Task</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Task Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Enter task title"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
              placeholder="Optional description..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as Task['priority'] })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estimate Hours</label>
            <input
              type="number"
              value={formData.estimateHours}
              onChange={(e) => setFormData({ ...formData, estimateHours: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Optional estimate"
              min="0"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.title.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium disabled:bg-gray-400 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Task'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==================== CREATE SCOPE MODAL ====================
interface CreateScopeModalProps {
  brands: Brand[];
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateScopeModal({ brands, onClose, onSuccess }: CreateScopeModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    brandFilter: 'all' as 'all' | 'specific',
    brandId: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      setError('Scope name is required');
      return;
    }
    if (formData.brandFilter === 'specific' && !formData.brandId) {
      setError('Please select a brand');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/scopes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.message || 'Failed to create scope');
        setLoading(false);
        return;
      }

      setShowSuccess(true);
      onSuccess();
      setLoading(false);
      // Reset form to allow adding another scope
      setFormData({
        name: '',
        description: '',
        brandFilter: 'all',
        brandId: '',
      });
    } catch (err) {
      setError('Failed to create scope');
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white w-full max-w-md rounded-lg relative">
          <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-black" disabled={loading}>
            <X size={20} />
          </button>

          <div className="p-6">
            <h3 className="text-xl font-bold text-black mb-4">Create New Scope</h3>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-700 text-sm">
                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scope Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="e.g., Fitout, Refurbishment"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                  placeholder="Optional description..."
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apply to <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="brandFilter"
                      checked={formData.brandFilter === 'all'}
                      onChange={() => setFormData({ ...formData, brandFilter: 'all', brandId: '' })}
                      className="text-blue-600"
                      disabled={loading}
                    />
                    <span className="text-sm text-gray-700">All Brands</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="brandFilter"
                      checked={formData.brandFilter === 'specific'}
                      onChange={() => setFormData({ ...formData, brandFilter: 'specific' })}
                      className="text-blue-600"
                      disabled={loading}
                    />
                    <span className="text-sm text-gray-700">Specific Brand</span>
                  </label>
                </div>
              </div>

              {formData.brandFilter === 'specific' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Brand <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.brandId}
                    onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    disabled={loading}
                  >
                    <option value="">-- Select Brand --</option>
                    {brands.map((brand) => (
                      <option key={brand._id} value={brand._id}>{brand.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={onClose} 
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium disabled:bg-gray-400 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Scope'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <SuccessAlert isOpen={showSuccess} message="Scope created successfully!" onClose={() => setShowSuccess(false)} />
    </>
  );
}

// ==================== EDIT SCOPE MODAL ====================
interface EditScopeModalProps {
  scope: Scope;
  brands: Brand[];
  onClose: () => void;
  onSuccess: () => void;
}

export function EditScopeModal({ scope, brands, onClose, onSuccess }: EditScopeModalProps) {
  const [formData, setFormData] = useState({
    name: scope.name,
    description: scope.description || '',
    brandFilter: scope.brandFilter,
    brandId: scope.brandId || '',
    isActive: scope.isActive,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/scopes/${scope._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.message || 'Failed to update scope');
        setLoading(false);
        return;
      }

      setShowSuccess(true);
      onSuccess();
      setLoading(false);
      // Auto-close after a brief delay for edit modal (since it's a one-time edit)
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError('Failed to update scope');
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white w-full max-w-md rounded-lg relative">
          <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-black" disabled={loading}>
            <X size={20} />
          </button>

          <div className="p-6">
            <h3 className="text-xl font-bold text-black mb-4">Edit Scope</h3>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-700 text-sm">
                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scope Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="text-blue-600"
                    disabled={loading}
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={onClose} 
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium disabled:bg-gray-400 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Scope'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <SuccessAlert isOpen={showSuccess} message="Scope updated successfully!" onClose={() => setShowSuccess(false)} />
    </>
  );
}

// ==================== ADD WORKFLOW MODAL ====================
interface AddWorkflowModalProps {
  scopeId: string;
  onClose: () => void;
  onSuccess: (newWorkflow: Workflow) => void; // ✨ CHANGED: Now passes the workflow back
}

export function AddWorkflowModal({ scopeId, onClose, onSuccess }: AddWorkflowModalProps) {
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      setError('Workflow name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/scopes/${scopeId}/workflows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.message || 'Failed to add workflow');
        setLoading(false);
        return;
      }

      setShowSuccess(true);
      setLoading(false);
      
      // ✨ CHANGED: Pass the new workflow back to parent
      // Fetch the full workflow details
      const workflowResponse = await fetch(
        `${API_URL}/api/scopes/${scopeId}/workflows/${data.workflow._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (workflowResponse.ok) {
        const fullWorkflow = await workflowResponse.json();
        onSuccess(fullWorkflow);
      } else {
        onSuccess(data.workflow);
      }
      
      // Reset form to allow adding another workflow
      setFormData({ name: '', description: '' });
      
      // Auto-close after showing success
      setTimeout(() => {
        setShowSuccess(false);
      }, 1500);
    } catch (err) {
      setError('Failed to add workflow');
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white w-full max-w-md rounded-lg relative">
          <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-black" disabled={loading}>
            <X size={20} />
          </button>

          <div className="p-6">
            <h3 className="text-xl font-bold text-black mb-4">Add Workflow</h3>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-700 text-sm">
                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Workflow Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="e.g., Design & Build"
                  disabled={loading}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                  disabled={loading}
                  placeholder="Optional description..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={onClose} 
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading || !formData.name.trim()} 
                  className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium disabled:bg-gray-400 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Workflow'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <SuccessAlert isOpen={showSuccess} message="Workflow added successfully!" onClose={() => setShowSuccess(false)} />
    </>
  );
}

// ==================== MANAGE TASKS MODAL ====================
interface ManageTasksModalProps {
  scopeId: string;
  workflowId: string;
  onClose: () => void;
  onSuccess: () => void; // ✨ CHANGED: This now only triggers workflow refresh, not full component reload
}

export function ManageTasksModal({ scopeId, workflowId, onClose, onSuccess }: ManageTasksModalProps) {
  const [phases, setPhases] = useState<Phase[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingPhase, setIsAddingPhase] = useState(false);
  const [newPhaseName, setNewPhaseName] = useState('');
  const [phaseLoading, setPhaseLoading] = useState(false);
  
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const [taskFormModal, setTaskFormModal] = useState<{
    isOpen: boolean;
    phaseId: string;
  }>({
    isOpen: false,
    phaseId: '',
  });

  const [taskLoading, setTaskLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showExcelUpload, setShowExcelUpload] = useState(false);

  useEffect(() => {
    fetchPhases();
  }, []);

  const fetchPhases = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_URL}/api/scopes/${scopeId}/workflows/${workflowId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        setPhases(data.phases || []);
      }
    } catch (error) {
      console.error('Error fetching phases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPhase = async () => {
    if (!newPhaseName.trim()) return;

    setPhaseLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_URL}/api/scopes/${scopeId}/workflows/${workflowId}/phases`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: newPhaseName, order: phases.length }),
        }
      );

      if (response.ok) {
        await fetchPhases();
        setNewPhaseName('');
        setIsAddingPhase(false);
        setSuccessMessage('Phase added successfully!');
        setShowSuccess(true);
        onSuccess(); // ✨ Refresh workflow in parent
      }
    } catch (error) {
      console.error('Error adding phase:', error);
    } finally {
      setPhaseLoading(false);
    }
  };

  const handleDeletePhase = (phaseId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Phase',
      message: 'Are you sure you want to delete this phase and all its tasks? This action cannot be undone.',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          await fetch(
            `${API_URL}/api/scopes/${scopeId}/workflows/${workflowId}/phases/${phaseId}`,
            {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          await fetchPhases();
          setSuccessMessage('Phase deleted successfully!');
          setShowSuccess(true);
          onSuccess(); // ✨ Refresh workflow in parent
        } catch (error) {
          console.error('Error deleting phase:', error);
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
    });
  };

  const handleAddTask = async (phaseId: string, taskData: Partial<Task>) => {
    setTaskLoading(true);
    try {
      const token = localStorage.getItem('token');
      await fetch(
        `${API_URL}/api/scopes/${scopeId}/workflows/${workflowId}/phases/${phaseId}/tasks`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(taskData),
        }
      );
      await fetchPhases();
      setTaskFormModal({ isOpen: false, phaseId: '' });
      setSuccessMessage('Task added successfully!');
      setShowSuccess(true);
      onSuccess(); // ✨ Refresh workflow in parent
    } catch (error) {
      console.error('Error adding task:', error);
    } finally {
      setTaskLoading(false);
    }
  };

  const handleDeleteTask = (phaseId: string, taskId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Task',
      message: 'Are you sure you want to delete this task?',
      variant: 'warning',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          await fetch(
            `${API_URL}/api/scopes/${scopeId}/workflows/${workflowId}/phases/${phaseId}/tasks/${taskId}`,
            {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          await fetchPhases();
          setSuccessMessage('Task deleted successfully!');
          setShowSuccess(true);
          onSuccess(); // ✨ Refresh workflow in parent
        } catch (error) {
          console.error('Error deleting task:', error);
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
    });
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white w-full max-w-4xl rounded-lg relative max-h-[90vh] overflow-y-auto">
          <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-black z-10">
            <X size={24} />
          </button>

          <div className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-black">Manage Workflow Tasks</h2>
                <p className="text-sm text-gray-600 mt-1">Create phases and predefined tasks</p>
              </div>
              <button
                onClick={() => setShowExcelUpload(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                <Upload size={18} />
                Upload Excel
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <Loader size={48} className="animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading phases...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {phases.map((phase) => (
                  <div key={phase._id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between p-4 bg-gray-50">
                      <h3 className="font-semibold text-gray-900">{phase.name}</h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setTaskFormModal({ isOpen: true, phaseId: phase._id })}
                          className="p-2 text-gray-600 hover:text-blue-600 rounded transition-colors"
                          title="Add task"
                        >
                          <Plus size={18} />
                        </button>
                        <button
                          onClick={() => handleDeletePhase(phase._id)}
                          className="p-2 text-gray-600 hover:text-red-600 rounded transition-colors"
                          title="Delete phase"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="p-4 bg-white">
                      {phase.tasks.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">No tasks yet. Click + to add a task.</p>
                      ) : (
                        <div className="space-y-2">
                          {phase.tasks.map((task) => (
                            <div key={task._id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{task.title}</div>
                                {task.description && <div className="text-sm text-gray-600 mt-1">{task.description}</div>}
                                <div className="flex items-center gap-3 mt-2">
                                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                    task.priority === 'Critical' ? 'bg-red-100 text-red-700' :
                                    task.priority === 'High' ? 'bg-orange-100 text-orange-700' :
                                    task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}>{task.priority}</span>
                                  {task.estimateHours && <span className="text-sm text-gray-600">{task.estimateHours}h</span>}
                                </div>
                              </div>
                              <button
                                onClick={() => handleDeleteTask(phase._id, task._id)}
                                className="p-2 text-gray-600 hover:text-red-600 rounded ml-4 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isAddingPhase ? (
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <input
                      type="text"
                      value={newPhaseName}
                      onChange={(e) => setNewPhaseName(e.target.value)}
                      placeholder="Enter phase name..."
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !phaseLoading) handleAddPhase();
                        if (e.key === 'Escape') { setIsAddingPhase(false); setNewPhaseName(''); }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      disabled={phaseLoading}
                    />
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={handleAddPhase}
                        disabled={!newPhaseName.trim() || phaseLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium flex items-center gap-2"
                      >
                        {phaseLoading ? (
                          <>
                            <Loader size={16} className="animate-spin" />
                            Adding...
                          </>
                        ) : (
                          'Add Phase'
                        )}
                      </button>
                      <button
                        onClick={() => { setIsAddingPhase(false); setNewPhaseName(''); }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium"
                        disabled={phaseLoading}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAddingPhase(true)}
                    className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-600 hover:text-blue-600 flex items-center justify-center gap-2 transition-colors font-medium"
                  >
                    <Plus size={20} />
                    <span>Add Phase</span>
                  </button>
                )}
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={onClose}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        confirmText="Delete"
        cancelText="Cancel"
      />

      <TaskFormModal
        isOpen={taskFormModal.isOpen}
        onClose={() => setTaskFormModal({ isOpen: false, phaseId: '' })}
        onSubmit={(taskData) => handleAddTask(taskFormModal.phaseId, taskData)}
        loading={taskLoading}
      />

      <SuccessAlert
        isOpen={showSuccess}
        message={successMessage}
        onClose={() => setShowSuccess(false)}
      />

      {showExcelUpload && (
        <ExcelUploadModal
          scopeId={scopeId}
          workflowId={workflowId}
          onClose={() => setShowExcelUpload(false)}
          onSuccess={() => {
            fetchPhases();
            onSuccess();
            setSuccessMessage('Tasks imported successfully from Excel!');
            setShowSuccess(true);
            setShowExcelUpload(false);
          }}
        />
      )}
    </>
  );
}