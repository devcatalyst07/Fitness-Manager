// Task-related TypeScript interfaces and types

export type TaskStatus = "Backlog" | "In Progress" | "Blocked" | "Done";
export type TaskPriority = "Low" | "Medium" | "High" | "Critical";
export type TaskType = "Task" | "Deliverable" | "Milestone"; // NEW
export type DependencyType = "FS" | "SS"; // NEW - Finish-Start or Start-Start

export interface Assignee {
  email: string;
  name: string;
}

export interface TaskDependency {
  taskId: string;
  type: DependencyType;
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  taskType: TaskType; // NEW
  assigneeEmail?: string;
  assigneeName?: string;
  assignees: Assignee[];
  startDate?: string;
  dueDate?: string;
  progress: number;
  estimateHours?: number;
  duration?: number; // NEW - Duration in working days
  dependencies: TaskDependency[]; // NEW
  projectId?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  phaseId?: string | null;
}

export interface CreateTaskData {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  taskType: TaskType; // NEW
  assignees: Assignee[];
  startDate: string;
  dueDate: string;
  progress: number;
  estimateHours?: number;
  duration?: number; // NEW
  dependencies?: TaskDependency[]; // NEW
  phaseId?: string | null;
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

export interface Phase {
  _id: string;
  name: string;
  description?: string;
  order: number;
  color?: string;
  projectId: string;
}

// NEW - Project interfaces
export interface Project {
  _id: string;
  projectName: string;
  brand: string;
  scope: string;
  workflow: string;
  scheduleFrom: 'start' | 'end';
  startDate?: string;
  endDate?: string;
  calculatedStartDate?: string;
  calculatedEndDate?: string;
  isAtRisk: boolean;
  riskReason?: string;
  status: string;
  budget: number;
  spent: number;
}