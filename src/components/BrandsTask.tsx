"use client";

import React, { useState, useEffect } from "react";
import { Clock, AlertCircle, CheckCircle2, ChevronDown } from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://fitout-manager-api.vercel.app";

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

interface BrandsTaskProps {
  onTaskClick: (task: DashboardTask) => void;
}

type TabType = "upcoming" | "overdue" | "completed";

export default function BrandsTask({ onTaskClick }: BrandsTaskProps) {
  const [activeTab, setActiveTab] = useState<TabType>("upcoming");
  const [selectedBrand, setSelectedBrand] = useState<string>("All");
  const [tasks, setTasks] = useState<DashboardTask[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchDashboardTasks();
  }, []);

  const fetchDashboardTasks = async () => {
    try {
      const token = localStorage.getItem("token");
      const projectsRes = await fetch(`${API_URL}/api/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!projectsRes.ok) {
        throw new Error("Failed to fetch projects");
      }

      const projects = await projectsRes.json();
      const uniqueBrands = Array.from(
        new Set(
          (projects || []).map(
            (project: any) =>
              project?.brand?.name ||
              project?.brandName ||
              project?.brand ||
              "",
          ),
        ),
      ).filter(Boolean) as string[];

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

          const tasksRes = await fetch(
            `${API_URL}/api/projects/${projectId}/tasks`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );

          if (!tasksRes.ok) {
            return [] as DashboardTask[];
          }

          const tasksData = await tasksRes.json();
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
        }),
      );

      const allTasks = taskResults.flat();
      setTasks(allTasks);
      setBrands(uniqueBrands);
    } catch (error) {
      console.error("Error fetching dashboard tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, selectedBrand, itemsPerPage]);

  // Filter tasks by tab and brand
  const filteredTasks = tasks.filter((task) => {
    const matchesTab = task.category === activeTab;
    const matchesBrand =
      selectedBrand === "All" || task.brand === selectedBrand;
    return matchesTab && matchesBrand;
  });

  // Sort by due date (ascending - nearest first) for upcoming/overdue
  // Completed sorted by completed date (ascending)
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
      {/* Header */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Brands Task</h2>

          {/* Brand Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
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

        {/* Tabs */}
        <div className="flex gap-2">
          {(["upcoming", "overdue", "completed"] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === tab
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {getTabIcon(tab)}
              <span className="capitalize">{tab}</span>
              <span
                className={`ml-1 px-2 py-0.5 rounded-full text-[11px] ${
                  activeTab === tab ? "bg-white/20" : "bg-gray-200"
                }`}
              >
                {getTabCount(tab)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div className="p-3">
        {sortedTasks.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">{getTabIcon(activeTab)}</div>
            <p className="text-gray-500 text-sm">
              No {activeTab} tasks{" "}
              {selectedBrand !== "All" ? `for ${selectedBrand}` : ""}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
              <p className="text-xs text-gray-500">
                Showing {startIndex + 1}-
                {Math.min(startIndex + itemsPerPage, sortedTasks.length)} of{" "}
                {sortedTasks.length} {activeTab} task
                {sortedTasks.length !== 1 ? "s" : ""}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs bg-white"
                >
                  {[10, 15, 20].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
              {paginatedTasks.map((task) => (
                <div
                  key={task._id}
                  onClick={() => onTaskClick(task)}
                  className="flex items-center justify-between p-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer group"
                >
                  <div className="flex items-start gap-3 flex-1">
                    {/* Status Icon */}
                    <div className="mt-1">
                      {activeTab === "upcoming" && (
                        <Clock size={18} className="text-blue-500" />
                      )}
                      {activeTab === "overdue" && (
                        <AlertCircle size={18} className="text-red-500" />
                      )}
                      {activeTab === "completed" && (
                        <CheckCircle2 size={18} className="text-green-500" />
                      )}
                    </div>

                    {/* Task Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 mb-1 group-hover:text-blue-600 transition-colors text-sm">
                        {task.title}
                      </h3>
                      <div className="flex items-center gap-3 text-[11px] text-gray-500">
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

                  {/* Status Badge */}
                  <div className="flex items-center gap-2 ml-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getPriorityColor(task.priority)}`}
                    >
                      {task.priority}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
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
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 text-xs border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <div className="text-xs text-gray-500">
                Page {currentPage} of {totalPages}
              </div>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 text-xs border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
