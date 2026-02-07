'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, Flag, Users, FileText, MessageSquare, Activity, Clock, Layers, Link2, AlertCircle, Edit2, Save, Send } from 'lucide-react';
import { Task, Comment, ActivityLog, Phase, TeamMember } from '@/types/task.types';
import {
  getPriorityBadge,
  getStatusBadge,
  formatDate,
  getInitials,
} from '@/utils/taskHelpers';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
  activeTab: 'details' | 'comments' | 'activity';
  setActiveTab: (tab: 'details' | 'comments' | 'activity') => void;
  comments: Comment[];
  activityLogs: ActivityLog[];
  newComment: string;
  setNewComment: (comment: string) => void;
  onAddComment: () => void;
  selectedFiles: File[];
  setSelectedFiles: (files: File[]) => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadingFiles: boolean;
  phases: Phase[];
  allTasks: Task[];
  // Additional optional props from remote
  onUpdateTask?: (taskId: string, data: Partial<Task>) => void;
  teamMembers?: TeamMember[];
  isEditing?: boolean;
  setIsEditing?: (editing: boolean) => void;
  onFileSelect?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile?: (index: number) => void;
  canEdit?: boolean;
}

export default function TaskDetailModal({
  isOpen,
  onClose,
  task,
  onUpdate,
  onDelete,
  activeTab,
  setActiveTab,
  comments,
  activityLogs,
  newComment,
  setNewComment,
  onAddComment,
  selectedFiles,
  setSelectedFiles,
  handleFileSelect,
  uploadingFiles,
  phases,
  allTasks,
  onUpdateTask,
  teamMembers,
  isEditing: externalIsEditing,
  setIsEditing: externalSetIsEditing,
  onFileSelect,
  onRemoveFile,
  canEdit = true,
}: TaskDetailModalProps) {
  const [internalIsEditing, setInternalIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState<Partial<Task>>({});

  // Use external editing state if provided, otherwise use internal
  const isEditing = externalIsEditing !== undefined ? externalIsEditing : internalIsEditing;
  const setIsEditing = externalSetIsEditing || setInternalIsEditing;

  useEffect(() => {
    if (task) {
      setEditedTask({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        taskType: task.taskType || 'Task',
        duration: task.duration || 1,
        startDate: task.startDate,
        dueDate: task.dueDate,
        progress: task.progress,
        phaseId: task.phaseId,
        dependencies: task.dependencies || [],
      });
    }
  }, [task]);

  useEffect(() => {
    if (isOpen && task && canEdit && externalSetIsEditing) {
      setEditedTask(task);
      externalSetIsEditing(true);
    }
  }, [isOpen, task, canEdit, externalSetIsEditing]);

  if (!isOpen || !task) return null;

  const handleSave = () => {
    if (editedTask.taskType === 'Milestone' && (editedTask.duration || 0) > 1) {
      alert('Milestone tasks can have a maximum duration of 1 day');
      return;
    }

    // Use onUpdateTask if provided, otherwise use onUpdate
    if (onUpdateTask && task._id) {
      onUpdateTask(task._id, editedTask);
    } else {
      onUpdate(task._id, editedTask);
    }
    setIsEditing(false);
  };

  const handleAddDependency = () => {
    setEditedTask({
      ...editedTask,
      dependencies: [
        ...(editedTask.dependencies || []),
        { taskId: '', type: 'FS' as const }
      ]
    });
  };

  const handleRemoveDependency = (index: number) => {
    setEditedTask({
      ...editedTask,
      dependencies: (editedTask.dependencies || []).filter((_, i) => i !== index)
    });
  };

  const handleDependencyChange = (
    index: number,
    field: 'taskId' | 'type',
    value: string
  ) => {
    const updated = [...(editedTask.dependencies || [])];
    if (field === 'taskId') {
      updated[index].taskId = value;
    } else {
      updated[index].type = value as 'FS' | 'SS';
    }
    setEditedTask({
      ...editedTask,
      dependencies: updated
    });
  };

  const getTaskTypeBadge = (taskType: string) => {
    const badges: Record<string, string> = {
      Task: 'bg-blue-100 text-blue-700 border-blue-200',
      Deliverable: 'bg-purple-100 text-purple-700 border-purple-200',
      Milestone: 'bg-green-100 text-green-700 border-green-200',
    };
    return badges[taskType] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getTaskTypeIcon = (taskType: string) => {
    const icons: Record<string, string> = {
      Task: '📋',
      Deliverable: '📦',
      Milestone: '🎯',
    };
    return icons[taskType] || '📋';
  };

  const getDependencyTypeLabel = (type: string) => {
    return type === 'FS' ? 'Finish → Start' : 'Start → Start';
  };

  const getAvailableTasks = (currentIndex: number) => {
    const selectedTaskIds = (editedTask.dependencies || [])
      .filter((_, i) => i !== currentIndex)
      .map(d => d.taskId);
    
    return allTasks.filter(t => 
      t._id !== task._id && !selectedTaskIds.includes(t._id)
    );
  };

  const currentTask = isEditing ? editedTask : task;

  // Use onFileSelect if provided, otherwise use handleFileSelect
  const fileSelectHandler = onFileSelect || handleFileSelect;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl max-h-[95vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-blue-700 to-blue-800 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">{getTaskTypeIcon(task.taskType || 'Task')}</span>
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-white">
                  {task.title}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getTaskTypeBadge(task.taskType || 'Task')}`}
                  >
                    {task.taskType || 'Task'}
                  </span>
                  {task.duration && (
                    <span className="text-white/80 text-xs flex items-center gap-1">
                      <Clock size={12} />
                      {task.duration} working day{task.duration !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {canEdit && (
                !isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-white/20 text-white hover:bg-white/30 rounded-lg transition-all flex items-center gap-2"
                  >
                    <Edit2 size={16} />
                    Edit
                  </button>
                ) : (
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-green-500 text-white hover:bg-green-600 rounded-lg transition-all flex items-center gap-2"
                  >
                    <Save size={16} />
                    Save
                  </button>
                )
              )}
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-all"
              >
                <X size={24} />
              </button>
            </div>
          </div>
        </div>

        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex px-8">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-6 py-4 font-medium transition-all ${
                activeTab === 'details'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText size={18} className="inline mr-2" />
              Details
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`px-6 py-4 font-medium transition-all ${
                activeTab === 'comments'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <MessageSquare size={18} className="inline mr-2" />
              Comments ({comments.length})
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`px-6 py-4 font-medium transition-all ${
                activeTab === 'activity'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Activity size={18} className="inline mr-2" />
              Activity
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Task Title
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedTask.title || ''}
                    onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900 font-medium">{task.title}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                {isEditing ? (
                  <textarea
                    value={editedTask.description || ''}
                    onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                ) : (
                  <p className="text-gray-700">{task.description || 'No description provided'}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Status
                  </label>
                  {isEditing ? (
                    <select
                      value={editedTask.status || ''}
                      onChange={(e) => setEditedTask({ ...editedTask, status: e.target.value as any })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Backlog">Backlog</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Blocked">Blocked</option>
                      <option value="Done">Done</option>
                    </select>
                  ) : (
                    <span
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusBadge(task.status)}`}
                    >
                      {task.status}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Priority
                  </label>
                  {isEditing ? (
                    <select
                      value={editedTask.priority || ''}
                      onChange={(e) => setEditedTask({ ...editedTask, priority: e.target.value as any })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  ) : (
                    <span
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${getPriorityBadge(task.priority)}`}
                    >
                      {task.priority}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Task Type
                  </label>
                  {isEditing ? (
                    <select
                      value={editedTask.taskType || 'Task'}
                      onChange={(e) => {
                        const newType = e.target.value as 'Task' | 'Deliverable' | 'Milestone';
                        setEditedTask({ 
                          ...editedTask, 
                          taskType: newType,
                          duration: newType === 'Milestone' ? 1 : editedTask.duration
                        });
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Task">Task</option>
                      <option value="Deliverable">Deliverable</option>
                      <option value="Milestone">Milestone</option>
                    </select>
                  ) : (
                    <span
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${getTaskTypeBadge(task.taskType || 'Task')}`}
                    >
                      {getTaskTypeIcon(task.taskType || 'Task')} {task.taskType || 'Task'}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phase
                  </label>
                  {isEditing ? (
                    <select
                      value={editedTask.phaseId || ''}
                      onChange={(e) => setEditedTask({ ...editedTask, phaseId: e.target.value || null })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  ) : (
                    <p className="text-gray-900">
                      {task.phaseId
                        ? phases.find((p) => p._id === task.phaseId)?.name || 'Unknown Phase'
                        : 'No Phase (Unassigned)'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Duration (Working Days)
                  </label>
                  {isEditing ? (
                    <div>
                      <input
                        type="number"
                        min="0"
                        max={editedTask.taskType === 'Milestone' ? 1 : undefined}
                        value={editedTask.duration || 1}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          const maxValue = editedTask.taskType === 'Milestone' ? 1 : value;
                          setEditedTask({ ...editedTask, duration: Math.min(value, maxValue) });
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {editedTask.taskType === 'Milestone' && (
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <AlertCircle size={12} />
                          Milestones can have a maximum duration of 1 day
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-900 flex items-center gap-2">
                      <Clock size={16} className="text-gray-500" />
                      {task.duration || 1} working day{(task.duration || 1) !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Link2 size={16} className="text-gray-500" />
                    Dependencies
                  </label>
                  {isEditing && (
                    <button
                      onClick={handleAddDependency}
                      className="text-xs px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      + Add
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-2">
                    {(editedTask.dependencies || []).length === 0 ? (
                      <p className="text-sm text-gray-500">No dependencies</p>
                    ) : (
                      (editedTask.dependencies || []).map((dep, index) => (
                        <div key={index} className="flex gap-2 items-center">
                          <select
                            value={dep.taskId}
                            onChange={(e) => handleDependencyChange(index, 'taskId', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          >
                            <option value="">-- Select Task --</option>
                            {getAvailableTasks(index).map((t) => (
                              <option key={t._id} value={t._id}>
                                {t.title} ({t.taskType})
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
                            onClick={() => handleRemoveDependency(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(!task.dependencies || task.dependencies.length === 0) ? (
                      <p className="text-sm text-gray-500">No dependencies</p>
                    ) : (
                      task.dependencies.map((dep, index) => {
                        const depTask = allTasks.find(t => t._id === dep.taskId);
                        return (
                          <div
                            key={index}
                            className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                          >
                            <Link2 size={14} className="text-gray-400" />
                            <span className="text-sm text-gray-700 flex-1">
                              {depTask?.title || 'Unknown Task'}
                            </span>
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                              {getDependencyTypeLabel(dep.type)}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Assigned To
                </label>
                <div className="flex flex-wrap gap-2">
                  {task.assignees && task.assignees.length > 0 ? (
                    task.assignees.map((assignee, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg"
                      >
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                          {getInitials(assignee.name)}
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {assignee.name}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No assignees</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Start Date
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={editedTask.startDate || ''}
                      onChange={(e) => setEditedTask({ ...editedTask, startDate: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{formatDate(task.startDate)}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Due Date
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={editedTask.dueDate || ''}
                      onChange={(e) => setEditedTask({ ...editedTask, dueDate: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{formatDate(task.dueDate)}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Progress: {isEditing ? editedTask.progress : task.progress}%
                </label>
                {isEditing ? (
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={editedTask.progress || 0}
                      onChange={(e) => setEditedTask({ ...editedTask, progress: parseInt(e.target.value) })}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editedTask.progress || 0}
                      onChange={(e) => setEditedTask({ ...editedTask, progress: parseInt(e.target.value) })}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ) : (
                  <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full"
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                )}
              </div>

              {!isEditing && canEdit && (
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this task?')) {
                        onDelete(task._id);
                        onClose();
                      }
                    }}
                    className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors text-sm font-medium"
                  >
                    Delete Task
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                
                {selectedFiles.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-2 rounded-lg text-sm"
                      >
                        <span className="text-gray-700">{file.name}</span>
                        <button
                          onClick={() => {
                            if (onRemoveFile) {
                              onRemoveFile(index);
                            } else {
                              setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
                            }
                          }}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between mt-3">
                  <label className="cursor-pointer text-sm text-blue-600 hover:text-blue-700">
                    <input
                      type="file"
                      multiple
                      onChange={fileSelectHandler}
                      className="hidden"
                    />
                    📎 Attach files
                  </label>
                  <button
                    onClick={onAddComment}
                    disabled={uploadingFiles || (!newComment.trim() && selectedFiles.length === 0)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 text-sm font-medium"
                  >
                    {uploadingFiles ? 'Uploading...' : 'Post Comment'}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {comments.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No comments yet</p>
                ) : (
                  <React.Fragment>
                    {comments.map((comment) => (
                      <div key={comment._id} className="bg-white border border-gray-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                            {getInitials(comment.userId.name)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-gray-900">
                                {comment.userId.name}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(comment.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-gray-700 text-sm whitespace-pre-wrap">
                              {comment.comment}
                            </p>
                            {comment.attachments && comment.attachments.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {comment.attachments.map((file, index) => {
                                  if (!file || !file.url) return null;
                                  return (
                                    <button
                                      key={index}
                                      onClick={() => window.open(file.url, '_blank')}
                                      className="text-xs px-2 py-1 bg-gray-100 text-blue-600 rounded hover:bg-gray-200"
                                    >
                                      📎 {file.name}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </React.Fragment>
                )}
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-4">
              {activityLogs.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No activity yet</p>
              ) : (
                activityLogs.map((log) => (
                  <div key={log._id} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 text-sm font-semibold">
                      {getInitials(log.user.name)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">
                        <span className="font-semibold">{log.user.name}</span>{' '}
                        {log.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(log.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}