// Brand Types

export interface Brand {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdBy: {
    _id?: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface BrandAnalytics {
  brandId: string;
  brandName: string;
  projectCount: number;
  taskStatusData: TaskStatusData[];
  budgetStatusData: BudgetStatusData[];
  totalTasks: number;
  completedTasks: number;
  totalBudget: number;
  totalSpent: number;
}

export interface TaskStatusData {
  status: "Backlog" | "In Progress" | "Blocked" | "Done";
  count: number;
}

export interface BudgetStatusData {
  status: "Planned" | "Committed" | "Invoiced" | "Paid";
  amount: number;
}

export interface BrandProject {
  _id: string;
  projectName: string;
  brand: string;
  status: "Planning" | "In Progress" | "Completed" | "On Hold";
  budget: number;
  spent: number;
  startDate?: string;
  endDate?: string;
  description?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BrandTeamMember {
  _id: string;
  name: string;
  email: string;
  role?: string;
  addedAt: string;
}