/**
 * Task API Service — FIXED
 *
 * KEY CHANGE: All calls now use `apiClient` from lib/axios.ts which:
 * - Sends cookies automatically (withCredentials: true)
 * - Handles 401 → refresh → retry automatically
 * - No more localStorage.getItem("token") — that was never set by cookie-based auth
 */

import { apiClient } from '@/lib/axios';
import {
  Task,
  CreateTaskData,
  UpdateTaskData,
  Comment,
  ActivityLog,
  TeamMember,
} from '@/types/task.types';

// ============================================
// PROJECT OPERATIONS
// ============================================

export const projectService = {
  getProject: async (projectId: string) => {
    return apiClient.get(`/api/projects/${projectId}`);
  },
};

// ============================================
// TASK OPERATIONS
// ============================================

export const taskService = {
  getTasks: async (projectId: string): Promise<Task[]> => {
    return apiClient.get(`/api/projects/${projectId}/tasks`);
  },

  getTask: async (taskId: string): Promise<Task> => {
    return apiClient.get(`/api/tasks/${taskId}`);
  },

  createTask: async (
    projectId: string,
    data: CreateTaskData
  ): Promise<{ task: Task }> => {
    return apiClient.post(`/api/projects/${projectId}/tasks`, data);
  },

  updateTask: async (
    projectId: string,
    taskId: string,
    data: Partial<UpdateTaskData>
  ): Promise<{ task: Task }> => {
    return apiClient.put(`/api/projects/${projectId}/tasks/${taskId}`, data);
  },

  deleteTask: async (taskId: string): Promise<{ message: string }> => {
    return apiClient.delete(`/api/tasks/${taskId}`);
  },
};

// ============================================
// COMMENT OPERATIONS
// ============================================

export const commentService = {
  getComments: async (taskId: string): Promise<Comment[]> => {
    return apiClient.get(`/api/tasks/${taskId}/comments`);
  },

  addComment: async (
    taskId: string,
    comment: string,
    attachments?: any[]
  ): Promise<{ comment: Comment }> => {
    return apiClient.post(`/api/tasks/${taskId}/comments`, { comment, attachments });
  },

  deleteComment: async (
    taskId: string,
    commentId: string
  ): Promise<{ message: string }> => {
    return apiClient.delete(`/api/tasks/${taskId}/comments/${commentId}`);
  },
};

// ============================================
// ACTIVITY LOG OPERATIONS
// ============================================

export const activityService = {
  getActivityLogs: async (taskId: string): Promise<ActivityLog[]> => {
    return apiClient.get(`/api/tasks/${taskId}/activity-logs`);
  },
};

// ============================================
// TEAM OPERATIONS
// ============================================

export const teamService = {
  getTeamMembers: async (projectId: string): Promise<TeamMember[]> => {
    return apiClient.get(`/api/projects/${projectId}/team`);
  },
};

// ============================================
// FILE UPLOAD OPERATIONS
// ============================================

export const fileService = {
  /**
   * Upload files — uses FormData, cookies sent automatically
   */
  uploadFiles: async (files: File[]): Promise<{ urls: string[] }> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    // Use raw axios import for FormData (needs different Content-Type)
    const { default: api } = await import('@/lib/axios');
    const response = await api.post('/api/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data;
  },
};

export default {
  project: projectService,
  task: taskService,
  comment: commentService,
  activity: activityService,
  team: teamService,
  file: fileService,
};