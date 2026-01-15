'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Plus, List, LayoutGrid, X } from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import FitoutLoadingSpinner from '@/components/FitoutLoadingSpinner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://fitout-manager-api.vercel.app';

interface Task {
  _id: string;
  title: string;
  description?: string;
  status: 'Backlog' | 'In Progress' | 'Blocked' | 'Done';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  assigneeEmail: string;
  assigneeName: string;
  dueDate?: string;
  progress: number;
}

export default function ProjectTasksPage() {
  const router = useRouter();
  const params = useParams();
  const [pathname, setPathname] = useState('/admin/projects');
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projectName, setProjectName] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'Backlog',
    priority: 'Medium',
    assigneeEmail: '',
    assigneeName: '',
    dueDate: '',
    progress: 0,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');

    if (!token || role !== 'admin') {
      localStorage.clear();
      router.replace('/');
    } else {
      setIsVerified(true);
      fetchProject();
      fetchTasks();
    }
  }, [params.id, router]);

  const fetchProject = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/projects/${params.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setProjectName(data.projectName);
      }
    } catch (error) {
      console.error('Error fetching project:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/projects/${params.id}/tasks`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!formData.title || !formData.assigneeEmail || !formData.assigneeName) {
      alert('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/projects/${params.id}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchTasks();
        setIsCreateModalOpen(false);
        setFormData({
          title: '',
          description: '',
          status: 'Backlog',
          priority: 'Medium',
          assigneeEmail: '',
          assigneeName: '',
          dueDate: '',
          progress: 0,
        });
        alert('Task created successfully!');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to create task');
      }
    } catch (error) {
      console.error('Create task error:', error);
      alert('Failed to create task');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTask = async () => {
    if (!selectedTask) return;

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/projects/${params.id}/tasks/${selectedTask._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(selectedTask),
      });

      if (response.ok) {
        await fetchTasks();
        setIsDetailModalOpen(false);
        alert('Task updated successfully!');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to update task');
      }
    } catch (error) {
      console.error('Update task error:', error);
      alert('Failed to update task');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/projects/${params.id}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        await fetchTasks();
        alert('Task deleted successfully!');
      }
    } catch (error) {
      console.error('Delete task error:', error);
      alert('Failed to delete task');
    }
  };

  const statusColors: { [key: string]: string } = {
    'Backlog': 'bg-gray-100 text-gray-700',
    'In Progress': 'bg-blue-100 text-blue-700',
    'Blocked': 'bg-red-100 text-red-700',
    'Done': 'bg-green-100 text-green-700'
  };

  const priorityColors: { [key: string]: string } = {
    'Low': 'bg-gray-100 text-gray-700',
    'Medium': 'bg-yellow-100 text-yellow-700',
    'High': 'bg-orange-100 text-orange-700',
    'Critical': 'bg-red-100 text-red-700'
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
  };

  const getTasksByStatus = (status: string) => tasks.filter(task => task.status === status);

  if (!isVerified || loading) return <FitoutLoadingSpinner />;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'Done').length;
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length;
  const blockedTasks = tasks.filter(t => t.status === 'Blocked').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar pathname={pathname} setPathname={setPathname} />
      <AdminHeader />

      <main className="lg:ml-64 mt-16 p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <button
            onClick={() => router.push(`/admin/projects/${params.id}`)}
            className="text-gray-600 hover:text-black mb-4 flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            <span>{projectName || 'Back to Project'}</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Tasks</h1>
          <p className="text-sm text-gray-600">Track and manage all project tasks</p>
        </div>

        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-6">
            {['Overview', 'Tasks', 'Budget', 'Documents', 'Team'].map((tab) => (
              <button
                key={tab}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                  tab === 'Tasks' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => {
                  if (tab === 'Overview') router.push(`/admin/projects/${params.id}`);
                  if (tab === 'Budget') router.push(`/admin/projects/${params.id}/budget`);
                  if (tab === 'Documents') router.push(`/admin/projects/${params.id}/documents`);
                  if (tab === 'Team') router.push(`/admin/projects/${params.id}/team`);
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2 bg-white border border-gray-200 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded flex items-center gap-2 ${
                viewMode === 'list' ? 'bg-gray-100' : 'text-gray-600'
              }`}
            >
              <List size={18} />
              <span>List</span>
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={`px-4 py-2 rounded flex items-center gap-2 ${
                viewMode === 'board' ? 'bg-gray-100' : 'text-gray-600'
              }`}
            >
              <LayoutGrid size={18} />
              <span>Board</span>
            </button>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus size={18} />
            <span>New Task</span>
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-gray-900 mb-1">{totalTasks}</p>
            <p className="text-sm text-gray-600">Total</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-green-600 mb-1">{completedTasks}</p>
            <p className="text-sm text-gray-600">Completed</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-blue-600 mb-1">{inProgressTasks}</p>
            <p className="text-sm text-gray-600">In Progress</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-red-600 mb-1">{blockedTasks}</p>
            <p className="text-sm text-gray-600">Blocked</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-purple-600 mb-1">{completionRate}%</p>
            <p className="text-sm text-gray-600">Completion</p>
          </div>
        </div>

        {tasks.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No tasks yet</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first task</p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg"
            >
              <Plus size={20} />
              <span>Create Task</span>
            </button>
          </div>
        ) : viewMode === 'list' ? (
          <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assignee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {tasks.map((task) => (
                  <tr key={task._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 cursor-pointer" onClick={() => { setSelectedTask(task); setIsDetailModalOpen(true); }}>
                      <div className="font-medium text-gray-900">{task.title}</div>
                      {task.description && <div className="text-sm text-gray-500">{task.description}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[task.status]}`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[task.priority]}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">{task.assigneeName}</td>
                    <td className="px-6 py-4 text-sm">{formatDate(task.dueDate)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${task.progress}%` }} />
                        </div>
                        <span className="text-sm text-gray-600 w-12 text-right">{task.progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => handleDeleteTask(task._id)} className="text-red-600 hover:text-red-800 text-sm">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {['Backlog', 'In Progress', 'Blocked', 'Done'].map((status) => (
              <div key={status} className="bg-gray-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">{status}</h3>
                  <span className="bg-gray-200 px-2 py-1 rounded text-sm">{getTasksByStatus(status).length}</span>
                </div>
                <div className="space-y-3">
                  {getTasksByStatus(status).map((task) => (
                    <div
                      key={task._id}
                      onClick={() => { setSelectedTask(task); setIsDetailModalOpen(true); }}
                      className="bg-white rounded-lg p-4 border cursor-pointer hover:shadow-md"
                    >
                      <h4 className="font-medium mb-2">{task.title}</h4>
                      {task.description && <p className="text-sm text-gray-600 mb-3">{task.description}</p>}
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${priorityColors[task.priority]}`}>
                          {task.priority}
                        </span>
                        <span className="text-xs text-gray-500">{formatDate(task.dueDate)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-2xl rounded-lg max-h-[90vh] overflow-y-auto">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Create New Task</h2>
                  <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-black">
                    <X size={24} />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Title *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg"
                      >
                        <option value="Backlog">Backlog</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Blocked">Blocked</option>
                        <option value="Done">Done</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Priority</label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Assignee Name *</label>
                      <input
                        type="text"
                        value={formData.assigneeName}
                        onChange={(e) => setFormData({ ...formData, assigneeName: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Assignee Email *</label>
                      <input
                        type="email"
                        value={formData.assigneeEmail}
                        onChange={(e) => setFormData({ ...formData, assigneeEmail: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Due Date</label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Progress (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.progress}
                      onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button onClick={() => setIsCreateModalOpen(false)} className="flex-1 px-4 py-3 border rounded-lg">
                    Cancel
                  </button>
                  <button onClick={handleCreateTask} disabled={saving} className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg">
                    {saving ? 'Creating...' : 'Create Task'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {isDetailModalOpen && selectedTask && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-4xl rounded-lg max-h-[90vh] overflow-y-auto">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Task Details</h2>
                  <button onClick={() => setIsDetailModalOpen(false)} className="text-gray-400 hover:text-black">
                    <X size={24} />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Title</label>
                    <input
                      type="text"
                      value={selectedTask.title}
                      onChange={(e) => setSelectedTask({ ...selectedTask, title: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={selectedTask.description || ''}
                      onChange={(e) => setSelectedTask({ ...selectedTask, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Status</label>
                      <select
                        value={selectedTask.status}
                        onChange={(e) => setSelectedTask({ ...selectedTask, status: e.target.value as any })}
                        className="w-full px-4 py-2 border rounded-lg"
                      >
                        <option value="Backlog">Backlog</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Blocked">Blocked</option>
                        <option value="Done">Done</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Priority</label>
                      <select
                        value={selectedTask.priority}
                        onChange={(e) => setSelectedTask({ ...selectedTask, priority: e.target.value as any })}
                        className="w-full px-4 py-2 border rounded-lg"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Assignee</label>
                    <p className="text-gray-900">{selectedTask.assigneeName} ({selectedTask.assigneeEmail})</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Due Date</label>
                    <input
                      type="date"
                      value={formatDateForInput(selectedTask.dueDate)}
                      onChange={(e) => setSelectedTask({ ...selectedTask, dueDate: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Progress (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={selectedTask.progress}
                      onChange={(e) => setSelectedTask({ ...selectedTask, progress: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${selectedTask.progress}%` }} />
                      </div>
                      <span className="text-sm">{selectedTask.progress}%</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setIsDetailModalOpen(false)} className="flex-1 px-4 py-3 border rounded-lg">
                    Cancel
                  </button>
                  <button onClick={handleUpdateTask} disabled={saving} className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg">
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