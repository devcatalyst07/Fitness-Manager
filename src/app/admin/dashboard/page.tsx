"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import SessionGuard from "@/components/SessionGuard";
import { AdminSidebar } from "@/components/AdminSidebar";
import FitoutLoadingSpinner from "@/components/FitoutLoadingSpinner";
import AdminHeader from "@/components/AdminHeader";
import ScopeWorkflowArchitecture from "@/components/ScopeWorkflowArchitecture";
import BrandManagement from "@/components/BrandManagement";
import ThreadsSection from "@/components/ThreadsSection";
import BrandsTask from "@/components/BrandsTask";
import TaskDetailModal from "@/components/TaskDetailModal";
import { apiClient } from "@/lib/axios";

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

export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedTask, setSelectedTask] = useState<DashboardTask | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "comments" | "activity">("details");
  const [comments, setComments] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");

  // Removed conflicting redirect logic - SessionGuard handles this
  // Only check role and redirect if wrong role
  useEffect(() => {
    if (!authLoading && user && user.role !== 'admin') {
      console.log('⚠️ User role is not admin, redirecting to user dashboard');
      router.replace('/user/dashboard');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchDashboardStats();
      fetchBrands();
    }
  }, [user]);

  const fetchDashboardStats = async () => {
    try {
      const data = await apiClient.get('/api/admin/dashboard/stats');
      setStats({ projectStats: data.projectStats });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBrands = async () => {
    try {
      const data = await apiClient.get('/api/brands/all');
      setBrands(data);
      if (data.length > 0 && !selectedBrand) {
        setSelectedBrand(data[0]);
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
      await apiClient.post(`/api/tasks/${selectedTask._id}/comments`, {
        text: newComment
      });
      
      setNewComment("");
      const commentsData = await apiClient.get(`/api/tasks/${selectedTask._id}/comments`);
      setComments(commentsData);
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  // Show loading only while checking auth or fetching initial data
  if (authLoading || (loading && user?.role === 'admin')) {
    return <FitoutLoadingSpinner />;
  }

  // If wrong role, show loading while redirecting
  if (user && user.role !== 'admin') {
    return <FitoutLoadingSpinner />;
  }

  const projectStats = stats?.projectStats;

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
    <SessionGuard>
      <div className="min-h-screen bg-gray-50">
        <AdminSidebar userRole="admin" />
        <AdminHeader />

        <main className="lg:ml-64 mt-16 p-4 sm:p-6 lg:p-8 transition-all duration-300">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">
            Dashboard
          </h1>

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

          <div className="mb-8">
            <BrandsTask onTaskClick={handleTaskClick} />
          </div>

          <div className="mb-8">
            <ScopeWorkflowArchitecture
              onRefresh={handleRefresh}
              scopeId=""
              brandName="All Brands"
              canCreateScope={true}
              userRole="admin"
            />
          </div>

          <div className="mb-8">
            <BrandManagement
              brands={brands}
              onRefresh={fetchBrands}
              onBrandSelect={handleBrandSelect}
              selectedBrandId={selectedBrand?._id}
              canAddUser={true}
            />
          </div>

          {selectedBrand && (
            <div className="mb-8">
              <ThreadsSection
                brandId={selectedBrand._id}
                brandName={selectedBrand.name}
              />
            </div>
          )}

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
            
            onUpdate={async (updatedTask: any) => {
              try {
                await apiClient.put(`/api/tasks/${updatedTask._id}`, updatedTask);
                fetchDashboardStats();
              } catch (error) {
                console.error('Error updating task:', error);
              }
            }}
            onDelete={async (taskId: string) => {
              try {
                await apiClient.delete(`/api/tasks/${taskId}`);
                handleTaskModalClose();
                fetchDashboardStats();
              } catch (error) {
                console.error('Error deleting task:', error);
              }
            }}
            
            selectedFiles={[]}
            setSelectedFiles={() => {}}
            handleFileSelect={(e: React.ChangeEvent<HTMLInputElement>) => {
              console.log('Files selected:', e.target.files);
            }}
            uploadingFiles={false}
            
            phases={[]}
            allTasks={[]}
            
            canEdit={true}
          />
        )}
      </div>
    </SessionGuard>
  );
}