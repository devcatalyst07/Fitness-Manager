import React, { useState } from 'react';
import { X, Plus, Trash2, Edit2, Upload, GripVertical } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://fitout-manager-api.vercel.app';

interface Workflow {
  _id: string;
  name: string;
  description?: string;
  phases: Phase[];
}

interface Phase {
  _id: string;
  name: string;
  order: number;
  tasks: PredefinedTask[];
}

interface PredefinedTask {
  _id: string;
  title: string;
  description?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  estimateHours?: number;
  order: number;
}

// ==================== EDIT WORKFLOW MODAL ====================
interface EditWorkflowModalProps {
  scopeId: string;
  workflow: Workflow;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditWorkflowModal({
  scopeId,
  workflow,
  onClose,
  onSuccess,
}: EditWorkflowModalProps) {
  const [formData, setFormData] = useState({
    name: workflow.name,
    description: workflow.description || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');

    if (!formData.name) {
      setError('Workflow name is required');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_URL}/api/scopes/${scopeId}/workflows/${workflow._id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to update workflow');
        setLoading(false);
        return;
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Update workflow error:', err);
      setError('Failed to update workflow');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-md rounded-lg relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-black transition-colors"
        >
          <X size={20} />
        </button>

        <div className="p-6">
          <h3 className="text-xl font-bold text-black mb-4">Edit Workflow</h3>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Workflow Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-black text-white hover:bg-gray-800 rounded-lg transition-colors disabled:bg-gray-400"
            >
              {loading ? 'Updating...' : 'Update'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== MANAGE TASKS MODAL ====================
interface ManageTasksModalProps {
  scopeId: string;
  workflow: Workflow;
  onClose: () => void;
  onSuccess: () => void;
}

export function ManageTasksModal({
  scopeId,
  workflow,
  onClose,
  onSuccess,
}: ManageTasksModalProps) {
  const [phases, setPhases] = useState<Phase[]>(workflow.phases || []);
  const [editingPhase, setEditingPhase] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<{
    phaseId: string;
    taskId: string;
  } | null>(null);
  const [newPhaseName, setNewPhaseName] = useState('');
  const [isAddingPhase, setIsAddingPhase] = useState(false);
  const [showImportExcel, setShowImportExcel] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleAddPhase = async () => {
    if (!newPhaseName.trim()) return;

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_URL}/api/scopes/${scopeId}/workflows/${workflow._id}/phases`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: newPhaseName,
            order: phases.length,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPhases([...phases, data.phase]);
        setNewPhaseName('');
        setIsAddingPhase(false);
        onSuccess();
      }
    } catch (error) {
      console.error('Add phase error:', error);
      alert('Failed to add phase');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePhase = async (phaseId: string, newName: string) => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_URL}/api/scopes/${scopeId}/workflows/${workflow._id}/phases/${phaseId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: newName }),
        }
      );

      if (response.ok) {
        onSuccess();
        setEditingPhase(null);
      }
    } catch (error) {
      console.error('Update phase error:', error);
      alert('Failed to update phase');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePhase = async (phaseId: string) => {
    if (!confirm('Delete this phase and all its tasks?')) return;

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_URL}/api/scopes/${scopeId}/workflows/${workflow._id}/phases/${phaseId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        setPhases(phases.filter((p) => p._id !== phaseId));
        onSuccess();
      }
    } catch (error) {
      console.error('Delete phase error:', error);
      alert('Failed to delete phase');
    } finally {
      setSaving(false);
    }
  };

  const handleAddTask = async (phaseId: string) => {
    const phase = phases.find((p) => p._id === phaseId);
    if (!phase) return;

    // Open add task form
    const taskTitle = prompt('Enter task title:');
    if (!taskTitle) return;

    const taskDescription = prompt('Enter task description (optional):');
    const priority = prompt('Enter priority (Low/Medium/High/Critical):') || 'Medium';
    const estimateHours = prompt('Enter estimate hours (optional):');

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_URL}/api/scopes/${scopeId}/workflows/${workflow._id}/phases/${phaseId}/tasks`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: taskTitle,
            description: taskDescription || '',
            priority,
            estimateHours: estimateHours ? parseInt(estimateHours) : undefined,
            order: phase.tasks.length,
          }),
        }
      );

      if (response.ok) {
        onSuccess();
      }
    } catch (error) {
      console.error('Add task error:', error);
      alert('Failed to add task');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async (phaseId: string, taskId: string) => {
    if (!confirm('Delete this task?')) return;

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_URL}/api/scopes/${scopeId}/workflows/${workflow._id}/phases/${phaseId}/tasks/${taskId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        onSuccess();
      }
    } catch (error) {
      console.error('Delete task error:', error);
      alert('Failed to delete task');
    } finally {
      setSaving(false);
    }
  };

  const handleImportExcel = async (file: File) => {
    // This would parse the Excel file and import tasks
    // For now, we'll show a placeholder
    alert('Excel import functionality will be implemented. File: ' + file.name);
    setShowImportExcel(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-4xl rounded-lg relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-black transition-colors z-10"
        >
          <X size={24} />
        </button>

        <div className="p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-black mb-2">
              Manage Workflow Tasks
            </h2>
            <p className="text-sm text-gray-600">
              {workflow.name} - Create phases and predefined tasks
            </p>
          </div>

          {/* Import Excel Button */}
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowImportExcel(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Upload size={18} />
              <span>Import from Excel</span>
            </button>
          </div>

          {/* Phases List */}
          <div className="space-y-4">
            {phases.map((phase) => (
              <div
                key={phase._id}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                {/* Phase Header */}
                <div className="flex items-center justify-between p-4 bg-gray-50">
                  {editingPhase === phase._id ? (
                    <input
                      type="text"
                      defaultValue={phase.name}
                      onBlur={(e) => handleUpdatePhase(phase._id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleUpdatePhase(phase._id, e.currentTarget.value);
                        }
                      }}
                      autoFocus
                      className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  ) : (
                    <h3 className="font-semibold text-gray-900">{phase.name}</h3>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAddTask(phase._id)}
                      className="p-2 text-gray-600 hover:text-black hover:bg-white rounded transition-colors"
                      title="Add task"
                    >
                      <Plus size={18} />
                    </button>
                    <button
                      onClick={() => setEditingPhase(phase._id)}
                      className="p-2 text-gray-600 hover:text-black hover:bg-white rounded transition-colors"
                      title="Edit phase"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeletePhase(phase._id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-white rounded transition-colors"
                      title="Delete phase"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Tasks List */}
                <div className="p-4 bg-white">
                  {phase.tasks.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4 border border-dashed border-gray-300 rounded">
                      No tasks yet. Click + to add a task.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {phase.tasks.map((task) => (
                        <div
                          key={task._id}
                          className="flex items-start justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{task.title}</div>
                            {task.description && (
                              <div className="text-sm text-gray-600 mt-1">
                                {task.description}
                              </div>
                            )}
                            <div className="flex items-center gap-3 mt-2">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-xs ${
                                  task.priority === 'Critical'
                                    ? 'bg-red-100 text-red-700'
                                    : task.priority === 'High'
                                    ? 'bg-orange-100 text-orange-700'
                                    : task.priority === 'Medium'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {task.priority}
                              </span>
                              {task.estimateHours && (
                                <span className="text-sm text-gray-600">
                                  {task.estimateHours}h
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => handleDeleteTask(phase._id, task._id)}
                              className="p-2 text-gray-600 hover:text-red-600 rounded transition-colors"
                              title="Delete task"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Add Phase Form */}
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
                    if (e.key === 'Escape') {
                      setIsAddingPhase(false);
                      setNewPhaseName('');
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleAddPhase}
                    disabled={!newPhaseName.trim() || saving}
                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400"
                  >
                    Add Phase
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingPhase(false);
                      setNewPhaseName('');
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingPhase(true)}
                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-black hover:text-black transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                <span>Add Phase</span>
              </button>
            )}
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>

      {/* Import Excel Modal */}
      {showImportExcel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white w-full max-w-md rounded-lg p-6">
            <h3 className="text-lg font-bold mb-4">Import Tasks from Excel</h3>
            <p className="text-sm text-gray-600 mb-4">
              Upload an Excel file with your predefined tasks. The file should have
              columns: Phase, Task Title, Description, Priority, Estimate Hours.
            </p>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImportExcel(file);
              }}
              className="mb-4"
            />
            <button
              onClick={() => setShowImportExcel(false)}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}