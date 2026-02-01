import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit2 } from 'lucide-react';

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

      onSuccess();
      onClose();
    } catch (err) {
      setError('Failed to create scope');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-md rounded-lg relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-black">
          <X size={20} />
        </button>

        <div className="p-6">
          <h3 className="text-xl font-bold text-black mb-4">Create New Scope</h3>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
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
                >
                  <option value="">-- Select Brand --</option>
                  {brands.map((brand) => (
                    <option key={brand._id} value={brand._id}>{brand.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg disabled:bg-gray-400">
                {loading ? 'Creating...' : 'Create Scope'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
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

      onSuccess();
      onClose();
    } catch (err) {
      setError('Failed to update scope');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-md rounded-lg relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-black">
          <X size={20} />
        </button>

        <div className="p-6">
          <h3 className="text-xl font-bold text-black mb-4">Edit Scope</h3>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
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
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="text-blue-600"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg disabled:bg-gray-400">
                {loading ? 'Updating...' : 'Update Scope'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ==================== ADD WORKFLOW MODAL ====================
interface AddWorkflowModalProps {
  scopeId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddWorkflowModal({ scopeId, onClose, onSuccess }: AddWorkflowModalProps) {
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

      onSuccess();
      onClose();
    } catch (err) {
      setError('Failed to add workflow');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-md rounded-lg relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-black">
          <X size={20} />
        </button>

        <div className="p-6">
          <h3 className="text-xl font-bold text-black mb-4">Add Workflow</h3>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
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
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg disabled:bg-gray-400">
                {loading ? 'Adding...' : 'Add Workflow'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ==================== MANAGE TASKS MODAL ====================
interface ManageTasksModalProps {
  scopeId: string;
  workflowId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ManageTasksModal({ scopeId, workflowId, onClose, onSuccess }: ManageTasksModalProps) {
  const [phases, setPhases] = useState<Phase[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingPhase, setIsAddingPhase] = useState(false);
  const [newPhaseName, setNewPhaseName] = useState('');

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
        onSuccess();
      }
    } catch (error) {
      console.error('Error adding phase:', error);
    }
  };

  const handleDeletePhase = async (phaseId: string) => {
    if (!confirm('Delete this phase and all its tasks?')) return;

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
      onSuccess();
    } catch (error) {
      console.error('Error deleting phase:', error);
    }
  };

  const handleAddTask = async (phaseId: string) => {
    const title = prompt('Enter task title:');
    if (!title) return;

    const description = prompt('Enter task description (optional):') || '';
    const priority = (prompt('Enter priority (Low/Medium/High/Critical):') || 'Medium') as Task['priority'];
    const estimateHours = parseInt(prompt('Enter estimate hours (optional):') || '0');

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
          body: JSON.stringify({ title, description, priority, estimateHours: estimateHours || undefined }),
        }
      );
      await fetchPhases();
      onSuccess();
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleDeleteTask = async (phaseId: string, taskId: string) => {
    if (!confirm('Delete this task?')) return;

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
      onSuccess();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-4xl rounded-lg relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-black z-10">
          <X size={24} />
        </button>

        <div className="p-8">
          <h2 className="text-2xl font-bold text-black mb-2">Manage Workflow Tasks</h2>
          <p className="text-sm text-gray-600 mb-6">Create phases and predefined tasks</p>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {phases.map((phase) => (
                <div key={phase._id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between p-4 bg-gray-50">
                    <h3 className="font-semibold text-gray-900">{phase.name}</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAddTask(phase._id)}
                        className="p-2 text-gray-600 hover:text-blue-600 rounded"
                        title="Add task"
                      >
                        <Plus size={18} />
                      </button>
                      <button
                        onClick={() => handleDeletePhase(phase._id)}
                        className="p-2 text-gray-600 hover:text-red-600 rounded"
                        title="Delete phase"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-white">
                    {phase.tasks.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No tasks yet</p>
                    ) : (
                      <div className="space-y-2">
                        {phase.tasks.map((task) => (
                          <div key={task._id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{task.title}</div>
                              {task.description && <div className="text-sm text-gray-600 mt-1">{task.description}</div>}
                              <div className="flex items-center gap-3 mt-2">
                                <span className={`px-2 py-0.5 rounded text-xs ${
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
                              className="p-2 text-gray-600 hover:text-red-600 rounded ml-4"
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
                      if (e.key === 'Enter') handleAddPhase();
                      if (e.key === 'Escape') { setIsAddingPhase(false); setNewPhaseName(''); }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={handleAddPhase}
                      disabled={!newPhaseName.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      Add Phase
                    </button>
                    <button
                      onClick={() => { setIsAddingPhase(false); setNewPhaseName(''); }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingPhase(true)}
                  className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-600 hover:text-blue-600 flex items-center justify-center gap-2"
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
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}