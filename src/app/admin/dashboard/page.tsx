"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";
import FitoutLoadingSpinner from "@/components/FitoutLoadingSpinner";
import AdminHeader from "@/components/AdminHeader";
import ScopeWorkflowArchitecture from "@/components/ScopeWorkflowArchitecture";
import BrandManagement from "@/components/BrandManagement";
import ThreadsSection from "@/components/ThreadsSection";
import BrandsTask from "@/components/BrandsTask";
import TaskDetailModal from "@/components/TaskDetailModal";

// ==================== Types ====================
interface ProjectStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  planningProjects: number;
  budgetUsedPercentage: number;
  projectsThisMonth: number;
  activeChange: number;
}

interface Brand {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdBy: {
    name: string;
    email: string;
  };
  createdAt: string;
}

interface DashboardStats {
  projectStats: ProjectStats;
}

interface DashboardTask {
  _id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  progress: number;
  assignees: any[];
  brand: string;
  projectName: string;
  projectId: string;
  category: "upcoming" | "overdue" | "completed";
}

type ChangeType = "positive" | "negative" | "neutral";

// API URL
const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://fitout-manager-api.vercel.app";

// ==================== DashboardCard ====================
interface DashboardCardProps {
  title: string;
  value: string | number;
  change: string | number;
  changeType: ChangeType;
}

function DashboardCard({
  title,
  value,
  change,
  changeType,
}: DashboardCardProps) {
  const changeColor: Record<ChangeType, string> = {
    positive: "text-green-600",
    negative: "text-red-600",
    neutral: "text-gray-600",
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>
      <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
      <p className={`text-sm ${changeColor[changeType]}`}>{change}</p>
    </div>
  );
}

// ==================== AdminDashboard ====================
export default function AdminDashboard() {
  const router = useRouter();
  const [pathname, setPathname] = useState("/admin/dashboard");
  const [isVerified, setIsVerified] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);

  // Task modal state
  const [selectedTask, setSelectedTask] = useState<DashboardTask | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "details" | "comments" | "activity"
  >("details");
  const [comments, setComments] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");

    if (!token || role !== "admin") {
      localStorage.clear();
      router.replace("/");
    } else {
      setIsVerified(true);
      fetchDashboardStats();
      fetchBrands();
    }
  }, [router]);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/admin/dashboard/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch stats");
      }

      const data = await response.json();
      setStats({ projectStats: data.projectStats });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBrands = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/brands/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBrands(data);
        // Auto-select first brand if available
        if (data.length > 0 && !selectedBrand) {
          setSelectedBrand(data[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching brands:", error);
    }
  };

  const handleBrandSelect = (brand: Brand) => {
    setSelectedBrand(brand);
  };

  const handleRefresh = () => {
    fetchDashboardStats();
    fetchBrands();
  };

  // Handle task click
  const handleTaskClick = async (task: DashboardTask) => {
    router.push(`/admin/projects/${task.projectId}/tasks?taskId=${task._id}`);
  };

  const handleTaskModalClose = () => {
    setIsTaskModalOpen(false);
    setSelectedTask(null);
    setActiveTab("details");
    setComments([]);
    setActivityLogs([]);
    setNewComment("");
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedTask) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/tasks/${selectedTask._id}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text: newComment }),
        },
      );

      if (response.ok) {
        setNewComment("");
        const commentsRes = await fetch(
          `${API_URL}/api/tasks/${selectedTask._id}/comments`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (commentsRes.ok) {
          const commentsData = await commentsRes.json();
          setComments(commentsData);
        }
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  if (!isVerified || loading) {
    return <FitoutLoadingSpinner />;
  }

  const projectStats = stats?.projectStats;

  // Helpers
  const getChangeType = (value: number): ChangeType => {
    if (value > 0) return "positive";
    if (value < 0) return "negative";
    return "neutral";
  };

  const formatChange = (value: number, suffix = "") => {
    const sign = value > 0 ? "+" : "";
    return `${sign}${value} ${suffix}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar pathname={pathname} setPathname={setPathname} />
      <AdminHeader />

      <main className="lg:ml-64 mt-16 p-4 sm:p-6 lg:p-8 transition-all duration-300">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">
          Dashboard
        </h1>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <DashboardCard
            title="Total Projects"
            value={projectStats?.totalProjects || 0}
            change={formatChange(
              projectStats?.projectsThisMonth || 0,
              "from last month",
            )}
            changeType={getChangeType(projectStats?.projectsThisMonth || 0)}
          />

          <DashboardCard
            title="Active Tasks"
            value={projectStats?.activeProjects || 0}
            change={formatChange(
              projectStats?.activeChange || 0,
              "from last week",
            )}
            changeType={getChangeType(projectStats?.activeChange || 0)}
          />

          <DashboardCard
            title="Budget Used"
            value={`${projectStats?.budgetUsedPercentage || 0}%`}
            change={`${projectStats?.budgetUsedPercentage || 0}% of total budget`}
            changeType="neutral"
          />

          <DashboardCard
            title="Planning Projects"
            value={projectStats?.planningProjects || 0}
            change={`${projectStats?.completedProjects || 0} completed`}
            changeType="neutral"
          />
        </div>

        {/*Brands Task Widget*/}
        <div className="mb-8">
          <BrandsTask onTaskClick={handleTaskClick} />
        </div>

        {/* Scope and Workflow Architecture */}
        <div className="mb-8">
          <ScopeWorkflowArchitecture
            onRefresh={handleRefresh}
            scopeId=""
            brandName="All Brands"
            canCreateScope={true}
            userRole="admin"
          />
        </div>

        {/* Brand Management */}
        <div className="mb-8">
          <BrandManagement
            brands={brands}
            onRefresh={fetchBrands}
            onBrandSelect={handleBrandSelect}
            selectedBrandId={selectedBrand?._id}
            canAddUser={true}
          />
        </div>

        {/* Threads Section */}
        {selectedBrand && (
          <div className="mb-8">
            <ThreadsSection
              brandId={selectedBrand._id}
              brandName={selectedBrand.name}
            />
          </div>
        )}

        {/* Empty State for Threads */}
        {!selectedBrand && brands.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-500 mb-2">Select a brand to view threads</p>
            <p className="text-sm text-gray-400">
              Click on a brand above to see its threads and discussions
            </p>
          </div>
        )}

        {!selectedBrand && brands.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-500 mb-2">No brands available</p>
            <p className="text-sm text-gray-400">
              Create a brand first to start using threads
            </p>
          </div>
        )}
      </main>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          isOpen={isTaskModalOpen}
          onClose={handleTaskModalClose}
          task={selectedTask as any}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          comments={comments}
          activityLogs={activityLogs}
          newComment={newComment}
          setNewComment={setNewComment}
          onAddComment={handleAddComment}
          canEdit={true}
        />
      )}
    </div>
  );
}
