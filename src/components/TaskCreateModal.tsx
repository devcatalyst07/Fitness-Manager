'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, Flag, Users, FileText, Clock, Layers, Link2, AlertCircle } from 'lucide-react';
import { Task } from '@/types/task.types';

interface TeamMember {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  status: string;
}

interface Assignee {
  email: string;
  name: string;
}

interface Phase {
  _id: string;
  name: string;
  description?: string;
  order: number;
  color?: string;
  projectId: string;
}

interface FormData {
  title: string;
  description: string;
  status: string;
  priority: string;
  taskType: 'Task' | 'Deliverable' | 'Milestone';
  assignees: Assignee[];
  startDate: string;
  dueDate: string;
  progress: number;
  duration: number;
  phaseId: string | null;
  dependencies: { taskId: string; type: 'FS' | 'SS' }[];
}

interface TaskCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  selectedAssignees: Assignee[];
  setSelectedAssignees: React.Dispatch<React.SetStateAction<Assignee[]>>;
  teamMembers: TeamMember[];
  phases: Phase[];
  tasks: Task[];
  onSubmit: () => void;
  saving: boolean;
  checkMemberHasActiveTask: (email: string) => boolean;
}

export default function TaskCreateModal({
  isOpen,
  onClose,
  formData,
  setFormData,
  selectedAssignees,
  setSelectedAssignees,
  teamMembers,
  phases,
  tasks,
  onSubmit,
  saving,
  checkMemberHasActiveTask,
}: TaskCreateModalProps) {
  const [dependenciesExpanded, setDependenciesExpanded] = useState(false);

  if (!isOpen) return null;

  const handleAddAssignee = (email: string) => {
    const selectedMember = teamMembers.find((member) => member.userId.email === email);

    if (!selectedMember) return;

    const alreadyAdded = selectedAssignees.some(
      (a) => a.email === selectedMember.userId.email
    );

    if (alreadyAdded) {
      alert("This member is already added!");
      return;
    }

    const newAssignee = {
      email: selectedMember.userId.email,
      name: selectedMember.userId.name,
    };

    const updatedAssignees = [...selectedAssignees, newAssignee];

    setSelectedAssignees(updatedAssignees);
    setFormData({
      ...formData,
      assignees: updatedAssignees,
    });
  };

  const handleRemoveAssignee = (index: number) => {
    const updated = selectedAssignees.filter((_, i) => i !== index);
    setSelectedAssignees(updated);
    setFormData({
      ...formData,
      assignees: updated,
    });
  };

  const handleAddDependency = () => {
    setFormData({
      ...formData,
      dependencies: [
        ...formData.dependencies,
        { taskId: '', type: 'FS' as const }
      ]
    });
  };

  const handleRemoveDependency = (index: number) => {
    setFormData({
      ...formData,
      dependencies: formData.dependencies.filter((_, i) => i !== index)
    });
  };

  const handleDependencyChange = (
    index: number,
    field: 'taskId' | 'type',
    value: string
  ) => {
    const updated = [...formData.dependencies];
    if (field === 'taskId') {
      updated[index].taskId = value;
    } else {
      updated[index].type = value as 'FS' | 'SS';
    }
    setFormData({
      ...formData,
      dependencies: updated
    });
  };

  const getAvailableTasks = (currentIndex: number) => {
    const selectedTaskIds = formData.dependencies
      .filter((_, i) => i !== currentIndex)
      .map(d => d.taskId);
    
    return tasks.filter(t => !selectedTaskIds.includes(t._id));
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-800 px-6 sm:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <FileText className="text-white" size={20} />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold text-white">
                  Create New Task
                </h2>
                <p className="text-white/80 text-sm mt-0.5">
                  Fill in the details to create a task
                </p>
              </div>
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
        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          <div className="space-y-6">
            {/* Task Title */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <FileText size={16} className="text-gray-500" />
                Task Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter task title..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Description */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <FileText size={16} className="text-gray-500" />
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Provide task details and requirements..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              />
            </div>

            {/* Status, Priority, Task Type Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Flag size={16} className="text-gray-500" />
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white cursor-pointer"
                >
                  <option value="" disabled>Select status</option>
                  <option value="Backlog">📋 Backlog</option>
                  <option value="In Progress">🔄 In Progress</option>
                  <option value="Blocked">⚠️ Blocked</option>
                  <option value="Done">✅ Done</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Flag size={16} className="text-gray-500" />
                  Priority <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white cursor-pointer"
                >
                  <option value="" disabled>Select priority</option>
                  <option value="Low">🟢 Low</option>
                  <option value="Medium">🟡 Medium</option>
                  <option value="High">🟠 High</option>
                  <option value="Critical">🔴 Critical</option>
                </select>
              </div>

              {/* Task Type */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Layers size={16} className="text-gray-500" />
                  Task Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.taskType}
                  onChange={(e) => {
                    const newType = e.target.value as 'Task' | 'Deliverable' | 'Milestone';
                    setFormData({ 
                      ...formData, 
                      taskType: newType,
                      duration: newType === 'Milestone' ? 1 : formData.duration
                    });
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white cursor-pointer"
                >
                  <option value="Task">📋 Task</option>
                  <option value="Deliverable">📦 Deliverable</option>
                  <option value="Milestone">🎯 Milestone</option>
                </select>
              </div>
            </div>

            {/* Phase Selection & Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Layers size={16} className="text-gray-500" />
                  Phase
                </label>
                <select
                  value={formData.phaseId || ''}
                  onChange={(e) => setFormData({ ...formData, phaseId: e.target.value || null })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white cursor-pointer"
                >
                  <option value="">No Phase (Unassigned)</option>
                  {phases
                    .sort((a, b) => a.order - b.order)
                    .map((phase) => (
                      <option key={phase._id} value={phase._id}>
                        {phase.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Duration */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Clock size={16} className="text-gray-500" />
                  Duration (Working Days) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max={formData.taskType === 'Milestone' ? 1 : undefined}
                  value={formData.duration}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    const maxValue = formData.taskType === 'Milestone' ? 1 : value;
                    setFormData({ ...formData, duration: Math.min(value, maxValue) });
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                {formData.taskType === 'Milestone' && (
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    Milestones can have a maximum duration of 1 day
                  </p>
                )}
              </div>
            </div>

            {/* Dependencies Section (Collapsible) */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setDependenciesExpanded(!dependenciesExpanded)}
                className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Link2 size={16} className="text-gray-600" />
                  <span className="text-sm font-semibold text-gray-700">
                    Dependencies {formData.dependencies.length > 0 && `(${formData.dependencies.length})`}
                  </span>
                </div>
                <span className="text-gray-400">{dependenciesExpanded ? '▼' : '▶'}</span>
              </button>

              {dependenciesExpanded && (
                <div className="p-4 space-y-3">
                  {formData.dependencies.map((dep, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <select
                        value={dep.taskId}
                        onChange={(e) => handleDependencyChange(index, 'taskId', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        <option value="">-- Select Task --</option>
                        {getAvailableTasks(index).map((task) => (
                          <option key={task._id} value={task._id}>
                            {task.title} ({task.taskType})
                          </option>
                        ))}
                      </select>

                      <select
                        value={dep.type}
                        onChange={(e) => handleDependencyChange(index, 'type', e.target.value)}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        <option value="FS">Finish→Start</option>
                        <option value="SS">Start→Start</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => handleRemoveDependency(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleAddDependency}
                    className="w-full px-3 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-blue-500 hover:text-blue-600 transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <Link2 size={16} />
                    Add Dependency
                  </button>

                  <p className="text-xs text-gray-500 mt-2">
                    Dependencies determine when this task can start based on other tasks. 
                    Tasks can depend on tasks in any phase.
                  </p>
                </div>
              )}
            </div>

            {/* Assignees */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Users size={16} className="text-gray-500" />
                Assign Team Members <span className="text-red-500">*</span>
              </label>
              
              <select
                onChange={(e) => {
                  handleAddAssignee(e.target.value);
                  e.target.value = '';
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white cursor-pointer"
              >
                <option value="">+ Add team member</option>
                {teamMembers
                  .filter((member) => member.status === 'active')
                  .map((member) => (
                    <option key={member._id} value={member.userId.email}>
                      {member.userId.name}
                    </option>
                  ))}
              </select>

              {selectedAssignees.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-sm font-semibold text-blue-900 mb-3">
                    Selected Members ({selectedAssignees.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedAssignees.map((assignee, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 bg-white border border-blue-200 px-3 py-2 rounded-lg shadow-sm"
                      >
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                          {assignee.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{assignee.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAssignee(index)}
                          className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1 rounded transition-all"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedAssignees.length === 0 && (
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <Users size={14} />
                  No members assigned yet
                </p>
              )}
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Calendar size={16} className="text-gray-500" />
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Will be auto-calculated based on dependencies
                </p>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Calendar size={16} className="text-gray-500" />
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Will be auto-calculated from start + duration
                </p>
              </div>
            </div>

            {/* Progress */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Clock size={16} className="text-gray-500" />
                Progress: {formData.progress}%
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mt-3 bg-gray-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${formData.progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 sm:px-8 py-4 bg-gray-50">
          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              disabled={saving || !formData.title || formData.assignees.length === 0}
              className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl 
                          hover:bg-blue-700 transition-all 
                          disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </span>
              ) : (
                'Create Task'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}