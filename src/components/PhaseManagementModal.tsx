import React, { useState } from 'react';
import { X, Plus, Edit2, Trash2, GripVertical } from 'lucide-react';

interface Phase {
  _id: string;
  name: string;
  description?: string;
  order: number;
  color?: string;
  projectId: string;
}

interface PhaseManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  phases: Phase[];
  onCreatePhase: (phaseData: { name: string; description?: string; color?: string }) => Promise<boolean>;
  onUpdatePhase: (phaseId: string, phaseData: Partial<Phase>) => Promise<boolean>;
  onDeletePhase: (phaseId: string) => Promise<boolean>;
}

const PRESET_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F97316', // orange
];

export default function PhaseManagementModal({
  isOpen,
  onClose,
  phases,
  onCreatePhase,
  onUpdatePhase,
  onDeletePhase,
}: PhaseManagementModalProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingPhaseId, setEditingPhaseId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: PRESET_COLORS[0],
  });
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setFormData({ name: '', description: '', color: PRESET_COLORS[0] });
    setIsAdding(false);
    setEditingPhaseId(null);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      alert('Phase name is required');
      return;
    }

    setSaving(true);

    let success = false;
    if (editingPhaseId) {
      success = await onUpdatePhase(editingPhaseId, formData);
    } else {
      success = await onCreatePhase(formData);
    }

    setSaving(false);

    if (success) {
      resetForm();
    }
  };

  const handleEdit = (phase: Phase) => {
    setFormData({
      name: phase.name,
      description: phase.description || '',
      color: phase.color || PRESET_COLORS[0],
    });
    setEditingPhaseId(phase._id);
    setIsAdding(true);
  };

  const handleDelete = async (phaseId: string) => {
    setSaving(true);
    await onDeletePhase(phaseId);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-800 px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white">
                Manage Phases
              </h2>
              <p className="text-white/80 text-sm mt-1">
                Create and organize project phases
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-all"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Add/Edit Form */}
          {isAdding && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <h3 className="font-semibold text-gray-900 mb-4">
                {editingPhaseId ? 'Edit Phase' : 'Add New Phase'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phase Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Planning, Design, Development"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of this phase"
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color
                  </label>
                  <div className="flex gap-2">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-10 h-10 rounded-lg border-2 transition-all ${
                          formData.color === color
                            ? 'border-gray-900 scale-110'
                            : 'border-gray-300 hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleSubmit}
                    disabled={saving || !formData.name.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                  >
                    {saving ? 'Saving...' : editingPhaseId ? 'Update Phase' : 'Add Phase'}
                  </button>
                  <button
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add Phase Button */}
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full mb-6 p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              <span className="font-medium">Add New Phase</span>
            </button>
          )}

          {/* Phases List */}
          <div className="space-y-3">
            {phases.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg font-medium mb-2">No phases yet</p>
                <p className="text-sm">Add your first phase to get started</p>
              </div>
            ) : (
              phases
                .sort((a, b) => a.order - b.order)
                .map((phase, index) => (
                  <div
                    key={phase._id}
                    className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all"
                  >
                    {/* Drag Handle */}
                    <div className="cursor-move text-gray-400">
                      <GripVertical size={20} />
                    </div>

                    {/* Color Indicator */}
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: phase.color || '#3B82F6' }}
                    />

                    {/* Phase Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-500">
                          #{index + 1}
                        </span>
                        <h4 className="font-semibold text-gray-900 truncate">
                          {phase.name}
                        </h4>
                      </div>
                      {phase.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                          {phase.description}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(phase)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit phase"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(phase._id)}
                        disabled={saving}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete phase"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}