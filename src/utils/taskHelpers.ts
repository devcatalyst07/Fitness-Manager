// Task utility helper functions

import { Task, TaskPriority, TaskStatus, TaskStats } from "@/types/task.types";

/**
 * Get color class for task priority
 */
export const getPriorityColor = (priority: TaskPriority): string => {
  const colors: Record<TaskPriority, string> = {
    Critical: "bg-red-500",
    High: "bg-orange-500",
    Medium: "bg-yellow-500",
    Low: "bg-green-500",
  };
  return colors[priority] || "bg-gray-400";
};

/**
 * Get color class for task status
 */
export const getStatusColor = (status: TaskStatus): string => {
  const colors: Record<TaskStatus, string> = {
    Done: "bg-green-500",
    "In Progress": "bg-blue-500",
    Blocked: "bg-red-500",
    Backlog: "bg-gray-400",
  };
  return colors[status] || "bg-gray-400";
};

/**
 * Get badge styling for priority
 */
export const getPriorityBadge = (priority: TaskPriority): string => {
  const badges: Record<TaskPriority, string> = {
    Critical: "bg-red-100 text-red-700 border-red-200",
    High: "bg-orange-100 text-orange-700 border-orange-200",
    Medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
    Low: "bg-green-100 text-green-700 border-green-200",
  };
  return badges[priority] || "bg-gray-100 text-gray-700 border-gray-200";
};

/**
 * Get badge styling for status
 */
export const getStatusBadge = (status: TaskStatus): string => {
  const badges: Record<TaskStatus, string> = {
    Done: "bg-green-100 text-green-700 border-green-200",
    "In Progress": "bg-blue-100 text-blue-700 border-blue-200",
    Blocked: "bg-red-100 text-red-700 border-red-200",
    Backlog: "bg-gray-100 text-gray-700 border-gray-200",
  };
  return badges[status] || "bg-gray-100 text-gray-700 border-gray-200";
};

/**
 * Get priority icon emoji
 */
export const getPriorityIcon = (priority: TaskPriority): string => {
  const icons: Record<TaskPriority, string> = {
    Critical: "🔴",
    High: "🟠",
    Medium: "🟡",
    Low: "🟢",
  };
  return icons[priority] || "⚪";
};

/**
 * Get status icon emoji
 */
export const getStatusIcon = (status: TaskStatus): string => {
  const icons: Record<TaskStatus, string> = {
    Done: "✅",
    "In Progress": "🔄",
    Blocked: "⚠️",
    Backlog: "📋",
  };
  return icons[status] || "📋";
};

/**
 * Calculate task statistics
 */
export const calculateTaskStats = (tasks: Task[]): TaskStats => {
  const total = tasks.length;
  const backlog = tasks.filter((t) => t.status === "Backlog").length;
  const inProgress = tasks.filter((t) => t.status === "In Progress").length;
  const blocked = tasks.filter((t) => t.status === "Blocked").length;
  const done = tasks.filter((t) => t.status === "Done").length;
  const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

  return {
    total,
    backlog,
    inProgress,
    blocked,
    done,
    completionRate,
  };
};

/**
 * Format date to readable string
 */
export const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return "No date";

  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };

  return date.toLocaleDateString("en-US", options);
};

/**
 * Format date to relative time (e.g., "2 days ago")
 */
export const formatRelativeTime = (dateString: string): string => {
  if (!dateString) return "No date";

  try {
    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "Invalid date";
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return "Just now";
    if (diffMins < 60)
      return `${diffMins} ${diffMins === 1 ? "minute" : "minutes"} ago`;
    if (diffHours < 24)
      return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
    if (diffDays < 7)
      return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;

    return formatDate(dateString);
  } catch (error) {
    return "Invalid date";
  }
};

/**
 * Get initials from name
 */
export const getInitials = (name: string): string => {
  if (!name) return "??";

  const parts = name.trim().split(" ");
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Check if task is overdue
 */
export const isTaskOverdue = (task: Task): boolean => {
  if (!task.dueDate || task.status === "Done") return false;

  const dueDate = new Date(task.dueDate);
  const now = new Date();

  return dueDate < now;
};

/**
 * Get days until due date
 */
export const getDaysUntilDue = (dueDate: string | undefined): number | null => {
  if (!dueDate) return null;

  const due = new Date(dueDate);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return diffDays;
};

/**
 * Sort tasks by priority (Critical > High > Medium > Low)
 */
export const sortByPriority = (tasks: Task[]): Task[] => {
  const priorityOrder: Record<TaskPriority, number> = {
    Critical: 0,
    High: 1,
    Medium: 2,
    Low: 3,
  };

  return [...tasks].sort((a, b) => {
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
};

/**
 * Sort tasks by status (In Progress > Blocked > Backlog > Done)
 */
export const sortByStatus = (tasks: Task[]): Task[] => {
  const statusOrder: Record<TaskStatus, number> = {
    "In Progress": 0,
    Blocked: 1,
    Backlog: 2,
    Done: 3,
  };

  return [...tasks].sort((a, b) => {
    return statusOrder[a.status] - statusOrder[b.status];
  });
};

/**
 * Sort tasks by due date (soonest first)
 */
export const sortByDueDate = (tasks: Task[]): Task[] => {
  return [...tasks].sort((a, b) => {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });
};

/**
 * Filter tasks by status
 */
export const filterByStatus = (tasks: Task[], status: TaskStatus): Task[] => {
  return tasks.filter((task) => task.status === status);
};

/**
 * Filter tasks by priority
 */
export const filterByPriority = (
  tasks: Task[],
  priority: TaskPriority,
): Task[] => {
  return tasks.filter((task) => task.priority === priority);
};

/**
 * Filter overdue tasks
 */
export const filterOverdueTasks = (tasks: Task[]): Task[] => {
  return tasks.filter((task) => isTaskOverdue(task));
};

/**
 * Search tasks by title or description
 */
export const searchTasks = (tasks: Task[], query: string): Task[] => {
  if (!query.trim()) return tasks;

  const lowerQuery = query.toLowerCase();

  return tasks.filter((task) => {
    const titleMatch = task.title.toLowerCase().includes(lowerQuery);
    const descMatch = task.description?.toLowerCase().includes(lowerQuery);
    const assigneeMatch = task.assignees.some((a) =>
      a.name.toLowerCase().includes(lowerQuery),
    );

    return titleMatch || descMatch || assigneeMatch;
  });
};