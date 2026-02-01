// Task API Service - Centralized API calls

import {
  Task,
  CreateTaskData,
  UpdateTaskData,
  Comment,
  ActivityLog,
  TeamMember,
} from "@/types/task.types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://fitout-manager-api.vercel.app";

/**
 * Get authorization token from localStorage
 */
const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
};

/**
 * Create headers with authorization
 */
const getHeaders = (): HeadersInit => {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

/**
 * Handle API response errors
 */
const handleResponse = async (response: Response) => {
  const text = await response.text().catch(() => "");
  let body: any = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { message: text || `HTTP ${response.status}` };
  }

  if (!response.ok) {
    const message =
      body && body.message ? body.message : `HTTP ${response.status}`;
    const error: any = new Error(message);
    error.status = response.status;
    error.body = body;
    throw error;
  }

  return body;
};

// ============================================
// PROJECT OPERATIONS
// ============================================

export const projectService = {
  /**
   * Get project details
   */
  getProject: async (projectId: string) => {
    const response = await fetch(`${API_URL}/api/projects/${projectId}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

// ============================================
// TASK OPERATIONS
// ============================================

export const taskService = {
  /**
   * Get all tasks for a project
   */
  getTasks: async (projectId: string): Promise<Task[]> => {
    const response = await fetch(`${API_URL}/api/projects/${projectId}/tasks`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Get single task by ID
   */
  getTask: async (taskId: string): Promise<Task> => {
    const response = await fetch(`${API_URL}/api/tasks/${taskId}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Create new task
   */
  createTask: async (
    projectId: string,
    data: CreateTaskData,
  ): Promise<{ task: Task }> => {
    const response = await fetch(`${API_URL}/api/projects/${projectId}/tasks`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  /**
   * Update existing task
   */
  updateTask: async (
    projectId: string,
    taskId: string,
    data: Partial<UpdateTaskData>,
  ): Promise<{ task: Task }> => {
    const response = await fetch(
      `${API_URL}/api/projects/${projectId}/tasks/${taskId}`,
      {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(data),
      },
    );
    return handleResponse(response);
  },

  /**
   * Delete task
   */
  deleteTask: async (taskId: string): Promise<{ message: string }> => {
    const response = await fetch(`${API_URL}/api/tasks/${taskId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

// ============================================
// COMMENT OPERATIONS
// ============================================

export const commentService = {
  /**
   * Get comments for a task
   */
  getComments: async (taskId: string): Promise<Comment[]> => {
    const response = await fetch(`${API_URL}/api/tasks/${taskId}/comments`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Add comment to task
   */
  addComment: async (
    taskId: string,
    comment: string,
  ): Promise<{ comment: Comment }> => {
    const response = await fetch(`${API_URL}/api/tasks/${taskId}/comments`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ comment }),
    });
    return handleResponse(response);
  },

  /**
   * Delete comment
   */
  deleteComment: async (
    taskId: string,
    commentId: string,
  ): Promise<{ message: string }> => {
    const response = await fetch(
      `${API_URL}/api/tasks/${taskId}/comments/${commentId}`,
      {
        method: "DELETE",
        headers: getHeaders(),
      },
    );
    return handleResponse(response);
  },
};

// ============================================
// ACTIVITY LOG OPERATIONS
// ============================================

export const activityService = {
  /**
   * Get activity logs for a task
   */
  getActivityLogs: async (taskId: string): Promise<ActivityLog[]> => {
    const response = await fetch(
      `${API_URL}/api/tasks/${taskId}/activity-logs`,
      {
        headers: getHeaders(),
      },
    );
    return handleResponse(response);
  },
};

// ============================================
// TEAM OPERATIONS
// ============================================

export const teamService = {
  /**
   * Get team members for a project
   */
  getTeamMembers: async (projectId: string): Promise<TeamMember[]> => {
    const response = await fetch(`${API_URL}/api/projects/${projectId}/team`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

// ============================================
// FILE UPLOAD OPERATIONS
// ============================================

export const fileService = {
  /**
   * Upload files
   */
  uploadFiles: async (files: File[]): Promise<{ urls: string[] }> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    const token = getAuthToken();
    const response = await fetch(`${API_URL}/api/upload`, {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    return handleResponse(response);
  },
};

// ============================================
// EXPORT ALL SERVICES
// ============================================

export default {
  project: projectService,
  task: taskService,
  comment: commentService,
  activity: activityService,
  team: teamService,
  file: fileService,
};
