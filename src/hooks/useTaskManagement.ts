import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/axios';
import { Task, Comment, ActivityLog, TeamMember, Phase } from '@/types/task.types';
import {
  taskService,
  commentService,
  activityService,
  teamService,
  projectService,
  fileService,
} from '@/services/taskService';

export function useTaskManagement(projectId: string) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  // Loading
  const [loading, setLoading] = useState(true);

  // Project & Tasks
  const [projectName, setProjectName] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);

  // Phase Management
  const [phases, setPhases] = useState<Phase[]>([]);
  const [isPhaseModalOpen, setIsPhaseModalOpen] = useState(false);
  const [editingPhase, setEditingPhase] = useState<Phase | null>(null);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'activity'>('details');

  // Form Data
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    status: string;
    priority: string;
    taskType: 'Task' | 'Deliverable' | 'Milestone';
    assignees: { email: string; name: string }[];
    startDate: string;
    dueDate: string;
    progress: number;
    duration: number;
    phaseId: string | null;
    dependencies: { taskId: string; type: 'FS' | 'SS' }[];
  }>({
    title: '',
    description: '',
    status: '',
    priority: '',
    taskType: 'Task',
    assignees: [],
    startDate: '',
    dueDate: '',
    progress: 0,
    duration: 1,
    phaseId: null,
    dependencies: [],
  });
  const [saving, setSaving] = useState(false);

  // Team & Assignees
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<{ email: string; name: string }[]>([]);

  // Comments & Activity
  const [comments, setComments] = useState<Comment[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [newComment, setNewComment] = useState('');

  // File Upload
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Dropdown
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // ============================================
  // FIX: Use useAuth() instead of localStorage
  // ============================================
  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    fetchProject();
    fetchTasks();
    fetchTeamMembers();
    fetchPhases();
  }, [projectId, isAuthenticated]);

  // Click Outside Handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-menu')) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch Operations — all use apiClient (cookie auth)
  const fetchProject = async () => {
    try {
      const data = await projectService.getProject(projectId);
      setProjectName(data.projectName);
    } catch (error) {
      console.error('Error fetching project:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const data = await taskService.getTasks(projectId);

      if (data && typeof data === 'object' && 'allTasks' in data) {
        const allTasks = (data as { allTasks?: Task[] }).allTasks;
        setTasks(Array.isArray(allTasks) ? allTasks : []);
      } else if (Array.isArray(data)) {
        setTasks(data as Task[]);
      } else {
        setTasks([]);
      }
    } catch (error: any) {
      if (error?.response?.status === 403) {
        console.warn('Access denied when fetching tasks');
        setTasks([]);
      } else {
        console.error('Error fetching tasks:', error);
        setTasks([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const data = await teamService.getTeamMembers(projectId);
      setTeamMembers(data);
    } catch (error: any) {
      if (error?.response?.status === 403) {
        console.warn('Access denied when fetching team members');
        setTeamMembers([]);
      } else {
        console.error('Error fetching team members:', error);
      }
    }
  };

  const fetchComments = async (taskId: string) => {
    try {
      const data = await commentService.getComments(taskId);
      setComments(data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const fetchActivityLogs = async (taskId: string) => {
    try {
      const data = await activityService.getActivityLogs(taskId);
      setActivityLogs(data);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    }
  };

  // ============================================
  // Phase Operations — FIXED: use apiClient
  // ============================================
  const fetchPhases = async () => {
    try {
      const data = await apiClient.get(`/api/projects/${projectId}/phases`);
      setPhases(data);
    } catch (error) {
      console.error('Fetch phases error:', error);
    }
  };

  const createPhase = async (phaseData: {
    name: string;
    description?: string;
    color?: string;
  }): Promise<boolean> => {
    try {
      await apiClient.post(`/api/projects/${projectId}/phases`, phaseData);
      await fetchPhases();
      setIsPhaseModalOpen(false);
      return true;
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Failed to create phase');
      return false;
    }
  };

  const updatePhase = async (
    phaseId: string,
    phaseData: Partial<Phase>
  ): Promise<boolean> => {
    try {
      await apiClient.put(`/api/projects/${projectId}/phases/${phaseId}`, phaseData);
      await fetchPhases();
      setEditingPhase(null);
      return true;
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Failed to update phase');
      return false;
    }
  };

  const deletePhase = async (phaseId: string): Promise<boolean> => {
    if (!confirm('Delete this phase? Tasks will be moved to "Unassigned".')) {
      return false;
    }
    try {
      await apiClient.delete(`/api/projects/${projectId}/phases/${phaseId}`);
      await fetchPhases();
      await fetchTasks();
      return true;
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Failed to delete phase');
      return false;
    }
  };

  // ============================================
  // Task Operations
  // ============================================
  const createTask = async () => {
    if (!formData.title || formData.assignees.length === 0) {
      alert('Please fill in required fields');
      return;
    }

    if (formData.taskType === 'Milestone' && formData.duration > 1) {
      alert('Milestone tasks can have a maximum duration of 1 day');
      return;
    }

    setSaving(true);

    try {
      await taskService.createTask(projectId, {
        title: formData.title,
        description: formData.description,
        status: (formData.status as any) || 'Backlog',
        priority: (formData.priority as any) || 'Medium',
        taskType: formData.taskType,
        assignees: formData.assignees,
        startDate: formData.startDate,
        dueDate: formData.dueDate,
        progress: formData.progress,
        duration: formData.duration,
        dependencies: formData.dependencies,
        phaseId: formData.phaseId,
      });

      alert('Task created successfully!');
      setIsCreateModalOpen(false);
      resetForm();
      fetchTasks();
    } catch (error: any) {
      console.error('Create task error:', error);
      alert(error?.response?.data?.message || error.message || 'Failed to create task');
    } finally {
      setSaving(false);
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      await taskService.updateTask(projectId, taskId, updates);
      alert('Task updated successfully!');
      fetchTasks();
      if (selectedTask?._id === taskId) {
        setIsDetailModalOpen(false);
        setSelectedTask(null);
      }
    } catch (error: any) {
      console.error('Update task error:', error);
      alert(error?.response?.data?.message || error.message || 'Failed to update task');
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await taskService.deleteTask(taskId);
      alert('Task deleted successfully!');
      fetchTasks();
    } catch (error: any) {
      alert(error?.response?.data?.message || error.message || 'Failed to delete task');
    }
  };

  const changeTaskStatus = async (taskId: string, newStatus: any) => {
    try {
      await taskService.updateTask(projectId, taskId, { status: newStatus });
      fetchTasks();
    } catch (error: any) {
      alert(error?.response?.data?.message || error.message || 'Failed to change status');
    }
  };

  // ============================================
  // Comment Operations — FIXED: use apiClient
  // ============================================
  const addComment = async () => {
    if (!selectedTask || (!newComment.trim() && selectedFiles.length === 0))
      return;

    setUploadingFiles(true);

    try {
      let attachments: any[] = [];
      if (selectedFiles.length > 0) {
        const result = await fileService.uploadFiles(selectedFiles);
        attachments = Array.isArray(result) ? result : [];
      }

      await commentService.addComment(selectedTask._id, newComment, attachments);

      setNewComment('');
      setSelectedFiles([]);
      fetchComments(selectedTask._id);
      fetchActivityLogs(selectedTask._id);
    } catch (error: any) {
      console.error('Add comment error:', error);
      alert(error?.response?.data?.message || error.message || 'Failed to add comment');
    } finally {
      setUploadingFiles(false);
    }
  };

  // File Operations
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setSelectedFiles([...selectedFiles, ...Array.from(files)]);
    }
  };

  const uploadFiles = async (files: File[]) => {
    try {
      const result = await fileService.uploadFiles(files);
      setUploadingFiles(false);
      return result;
    } catch (error) {
      console.error('Upload error:', error);
      setUploadingFiles(false);
      return [];
    }
  };

  // Helpers
  const checkMemberHasActiveTask = (memberEmail: string): boolean => {
    return tasks.some(
      (task) =>
        task.assignees?.some((a) => a.email === memberEmail) &&
        task.status !== 'Done'
    );
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      status: '',
      priority: '',
      taskType: 'Task',
      assignees: [],
      startDate: '',
      dueDate: '',
      progress: 0,
      duration: 1,
      phaseId: null,
      dependencies: [],
    });
    setSelectedAssignees([]);
    setSelectedFiles([]);
  };

  const openTaskDetails = (task: Task) => {
    setSelectedTask(task);
    setActiveTab('details');
    setIsDetailModalOpen(true);
    fetchComments(task._id);
    fetchActivityLogs(task._id);
  };

  return {
    loading,
    isVerified: isAuthenticated,
    projectName,
    tasks,
    fetchTasks,
    isCreateModalOpen,
    setIsCreateModalOpen,
    isDetailModalOpen,
    setIsDetailModalOpen,
    selectedTask,
    setSelectedTask,
    activeTab,
    setActiveTab,
    formData,
    setFormData,
    saving,
    resetForm,
    teamMembers,
    selectedAssignees,
    setSelectedAssignees,
    checkMemberHasActiveTask,
    comments,
    activityLogs,
    newComment,
    setNewComment,
    addComment,
    fetchComments,
    fetchActivityLogs,
    selectedFiles,
    setSelectedFiles,
    uploadingFiles,
    handleFileSelect,
    uploadFiles,
    openDropdown,
    setOpenDropdown,
    createTask,
    updateTask,
    deleteTask,
    changeTaskStatus,
    openTaskDetails,
    phases,
    isPhaseModalOpen,
    setIsPhaseModalOpen,
    editingPhase,
    setEditingPhase,
    createPhase,
    updatePhase,
    deletePhase,
    fetchPhases,
  };
}