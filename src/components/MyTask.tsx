"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Clock, AlertCircle, CheckCircle2, ChevronDown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/axios";

interface TaskAssignee {
  email: string;
  name: string;
}

interface DashboardTask {
  _id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  completedAt?: string;
  progress: number;
  assignees: TaskAssignee[];
  brand: string;
  projectName: string;
  projectId: string;
  category: "upcoming" | "overdue" | "completed";
  createdAt: string;
  updatedAt: string;
}

interface MyTaskProps {
  onTaskClick: (task: DashboardTask) => void;
}

type TabType = "upcoming" | "overdue" | "completed";

export default function MyTask({ onTaskClick }: MyTaskProps) {
  // ✅ FIXED: Get user email from useAuth() instead of localStorage
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>("upcoming");
  const [selectedBrand, setSelectedBrand] = useState<string>("All");
  const [tasks, setTasks] = useState<DashboardTask[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (user) {
      fetchMyTasks();
    }
  }, [user]);

  const fetchMyTasks = async () => {
    try {
      // ✅ FIXED: Get email from useAuth() user object
      const userEmail = (user?.email || "").toLowerCase();

      // ✅ FIXED: Use apiClient instead of localStorage token + fetch
      const projects = await apiClient.get('/api/projects');

      const now = new Date();
      const isCompletedStatus = (status?: string) => {
        const normalized = (status || "").toLowerCase();
        return (
          normalized === "done" ||
          normalized === "completed" ||
          normalized === "complete"
        );
      };

      const taskResults = await Promise.all(
        (projects || []).map(async (project: any) => {
          const projectId = project._id;
          if (!projectId) return [] as DashboardTask[];

          try {
            // ✅ FIXED: Use apiClient
            const tasksData = await apiClient.get(
              `/api/projects/${projectId}/tasks`
            );

            const tasksList = Array.isArray(tasksData)
              ? tasksData
              : Array.isArray(tasksData?.allTasks)
                ? tasksData.allTasks
                : Array.isArray(tasksData?.tasks)
                  ? tasksData.tasks
                  : [];

            const brandName =
              project?.brand?.name || project?.brandName || project?.brand || "";
            const projectName = project?.projectName || project?.name || "";

            return (tasksList || []).map((task: any) => {
              const dueDate = task.dueDate ? new Date(task.dueDate) : null;
              const completedAt =
                task.completedAt || task.completedDate || task.updatedAt || null;
              const category: TabType = isCompletedStatus(task.status)
                ? "completed"
                : dueDate && dueDate < now
                  ? "overdue"
                  : "upcoming";

              const assignees = Array.isArray(task.assignees)
                ? task.assignees
                : task.assigneeEmail
                  ? [
                      {
                        email: task.assigneeEmail,
                        name: task.assigneeName || task.assigneeEmail,
                      },
                    ]
                  : [];

              return {
                _id: task._id,
                title: task.title,
                description: task.description,
                status: task.status,
                priority: task.priority,
                dueDate: task.dueDate,
                completedAt: completedAt || undefined,
                progress: task.progress ?? 0,
                assignees,
                brand: brandName,
                projectName,
                projectId,
                category,
                createdAt: task.createdAt,
                updatedAt: task.updatedAt,
              } as DashboardTask;
            });
          } catch {
            // If a project's tasks fail (e.g., 403), skip gracefully
            return [] as DashboardTask[];
          }
        }),
      );

      const allTasks = taskResults.flat();
      const assignedTasks = allTasks.filter((task) => {
        if (!userEmail) return false;
        return task.assignees.some(
          (assignee: TaskAssignee) =>
            assignee.email?.toLowerCase() === userEmail,
        );
      });

      const uniqueBrands = Array.from(
        new Set(assignedTasks.map((task) => task.brand || "")),
      ).filter(Boolean) as string[];

      setTasks(assignedTasks);
      setBrands(uniqueBrands);
    } catch (error) {
      console.error("Error fetching my tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, selectedBrand, itemsPerPage]);

  const filteredTasks = tasks.filter((task) => {
    const matchesTab = task.category === activeTab;
    const matchesBrand =
      selectedBrand === "All" || task.brand === selectedBrand;
    return matchesTab && matchesBrand;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (activeTab === "completed") {
      if (!a.completedAt) return 1;
      if (!b.completedAt) return -1;
      return (
        new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
      );
    }

    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  const totalPages = Math.max(1, Math.ceil(sortedTasks.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTasks = sortedTasks.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const formatDate = (dateString?: string) => {
    if (!dateString) return "No due date";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "text-red-600 bg-red-50 border-red-200";
      case "High":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "Medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "Low":
        return "text-green-600 bg-green-50 border-green-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getTabIcon = (tab: TabType) => {
    switch (tab) {
      case "upcoming":
        return <Clock size={16} />;
      case "overdue":
        return <AlertCircle size={16} />;
      case "completed":
        return <CheckCircle2 size={16} />;
    }
  };

  const getTabCount = (tab: TabType) => {
    const brandFiltered =
      selectedBrand === "All"
        ? tasks
        : tasks.filter((t) => t.brand === selectedBrand);
    return brandFiltered.filter((t) => t.category === tab).length;
  };

  const showPagination = useMemo(
    () => sortedTasks.length > itemsPerPage,
    [sortedTasks.length, itemsPerPage],
  );

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-100 rounded"></div>
            <div className="h-20 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">My Task</h2>

          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-medium text-gray-700">
                {selectedBrand}
              </span>
              <ChevronDown
                size={16}
                className={`text-gray-500 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <button
                  onClick={() => {
                    setSelectedBrand("All");
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                    selectedBrand === "All"
                      ? "bg-blue-50 text-blue-600 font-medium"
                      : "text-gray-700"
                  }`}
                >
                  All
                </button>
                {brands.map((brand) => (
                  <button
                    key={brand}
                    onClick={() => {
                      setSelectedBrand(brand);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                      selectedBrand === brand
                        ? "bg-blue-50 text-blue-600 font-medium"
                        : "text-gray-700"
                    }`}
                  >
                    {brand}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {(["upcoming", "overdue", "completed"] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {getTabIcon(tab)}
              <span className="capitalize">{tab}</span>
              <span
                className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab ? "bg-white/20" : "bg-gray-200"
                }`}
              >
                {getTabCount(tab)}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {paginatedTasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-2">{getTabIcon(activeTab)}</div>
            <p className="text-gray-500 text-sm">
              No {activeTab} tasks{" "}
              {selectedBrand !== "All" ? `for ${selectedBrand}` : ""}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 mb-4">
              Showing {paginatedTasks.length} {activeTab} task
              {paginatedTasks.length !== 1 ? "s" : ""}
            </p>

            {paginatedTasks.map((task) => (
              <div
                key={task._id}
                onClick={() => onTaskClick(task)}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer group"
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-1">
                    {activeTab === "upcoming" && (
                      <Clock size={20} className="text-blue-500" />
                    )}
                    {activeTab === "overdue" && (
                      <AlertCircle size={20} className="text-red-500" />
                    )}
                    {activeTab === "completed" && (
                      <CheckCircle2 size={20} className="text-green-500" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                      {task.title}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <span className="font-medium">Brand:</span>
                        {task.brand}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <span className="font-medium">Due:</span>
                        {formatDate(task.dueDate)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}
                  >
                    {task.priority}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      activeTab === "upcoming"
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : activeTab === "overdue"
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : "bg-green-50 text-green-700 border border-green-200"
                    }`}
                  >
                    {activeTab === "upcoming" && "Upcoming"}
                    {activeTab === "overdue" && "Overdue"}
                    {activeTab === "completed" && "Completed"}
                  </span>
                </div>
              </div>
            ))}

            {showPagination && (
              <div className="flex items-center justify-between pt-4">
                <p className="text-xs text-gray-500">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-xs rounded border border-gray-200 text-gray-600 disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-xs rounded border border-gray-200 text-gray-600 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}