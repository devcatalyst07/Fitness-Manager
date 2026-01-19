// Task-related TypeScript interfaces and types

export type TaskStatus = "Backlog" | "In Progress" | "Blocked" | "Done";
export type TaskPriority = "Low" | "Medium" | "High" | "Critical";

export interface Assignee {
  email: string;
  name: string;
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeEmail?: string;
  assigneeName?: string;
  assignees: Assignee[];
  startDate?: string;
  dueDate?: string;
  progress: number;
  estimateHours?: number;
  projectId?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTaskData {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignees: Assignee[];
  startDate: string;
  dueDate: string;
  progress: number;
  estimateHours?: number;
}

export interface UpdateTaskData extends Partial<CreateTaskData> {
  _id: string;
}

export interface Comment {
  _id: string;
  taskId: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  comment: string;
  attachments?: FileAttachment[];
  createdAt: string;
  updatedAt?: string;
}

export interface ActivityLog {
  _id: string;
  taskId: string;
  type: string;
  description: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  timestamp: string;
  createdAt?: string;
  metadata?: Record<string, any>;
}

export interface TeamMember {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  role: string;
  status: string;
  joinedAt?: string;
}

export interface TaskStats {
  total: number;
  backlog: number;
  inProgress: number;
  blocked: number;
  done: number;
  completionRate: number;
}

export interface FileAttachment {
  _id?: string;
  name: string;
  url?: string;
  size?: number;
  type?: string;
  uploadedAt?: string;
}
