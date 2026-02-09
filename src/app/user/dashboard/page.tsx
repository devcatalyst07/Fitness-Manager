"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import SessionGuard from "@/components/SessionGuard";
import { AdminSidebar } from "@/components/AdminSidebar";
import FitoutLoadingSpinner from "@/components/FitoutLoadingSpinner";
import AdminHeader from "@/components/AdminHeader";
import TaskDetailModal from "@/components/TaskDetailModal";
import { apiClient } from "@/lib/axios";

interface ProjectStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  myTasks: number;
  completedTasks: number;
  overdueTask: number;
}

interface DashboardStats {
  projectStats: ProjectStats;
  recentActivities: any[];
  upcomingTasks: any[];
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
  change?: string | number;
  changeType?: ChangeType;
  icon: React.ReactNode;
}

function DashboardCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon,
}: DashboardCardProps) {
  const changeColor: Record<ChangeType, string> = {
    positive: "text-green-600",
    negative: "text-red-600",
    neutral: "text-gray-600",
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <div className="text-blue-600">{icon}</div>
      </div>
      <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
      {change && (
        <p className={`text-sm ${changeColor[changeType]}`}>{change}</p>
      )}
    </div>
  );
}

export default function UserDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
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
    if (!authLoading && user && user.role === 'admin') {
      console.log('⚠️ Admin user accessing user dashboard, redirecting to admin dashboard');
      router.replace('/admin/dashboard');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.role === 'user') {
      fetchDashboardStats();
    }
  }, [user]);

  const fetchDashboardStats = async () => {
    try {
      const data = await apiClient.get('/api/dashboard');
      setStats(data);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskClick = async (task: DashboardTask) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
    
    try {
      const commentsData = await apiClient.get(`/api/tasks/${task._id}/comments`);
      setComments(commentsData);

      const activityData = await apiClient.get(`/api/tasks/${task._id}/activity`);
      setActivityLogs(activityData);
    } catch (error) {
      console.error("Error fetching task details:", error);
    }
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
  if (authLoading || (loading && user?.role === 'user')) {
    return <FitoutLoadingSpinner />;
  }

  // If wrong role, show loading while redirecting
  if (user && user.role !== 'user') {
    return <FitoutLoadingSpinner />;
  }

  const projectStats = stats?.projectStats;

  return (
    <SessionGuard>
      <div className="min-h-screen bg-gray-50">
        <AdminSidebar userRole="user" />
        <AdminHeader />

        <main className="lg:ml-64 mt-16 p-4 sm:p-6 lg:p-8 transition-all duration-300">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              My Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Welcome back, {user?.name}! Here's what's happening with your projects.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
            <DashboardCard
              title="My Projects"
              value={projectStats?.totalProjects || 0}
              change={`${projectStats?.activeProjects || 0} active`}
              changeType="neutral"
              icon={
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              }
            />

            <DashboardCard
              title="My Tasks"
              value={projectStats?.myTasks || 0}
              change={`${projectStats?.completedTasks || 0} completed`}
              changeType="positive"
              icon={
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              }
            />

            <DashboardCard
              title="Overdue Tasks"
              value={projectStats?.overdueTask || 0}
              change={projectStats?.overdueTask ? "Needs attention" : "All caught up!"}
              changeType={projectStats?.overdueTask ? "negative" : "positive"}
              icon={
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Recent Activities
                </h2>
              </div>
              <div className="p-6">
                {stats?.recentActivities && stats.recentActivities.length > 0 ? (
                  <div className="space-y-4">
                    {stats.recentActivities.slice(0, 5).map((activity: any, index: number) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-2 h-2 mt-2 bg-blue-500 rounded-full"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900">
                            {activity.description}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {activity.userName} •{" "}
                            {new Date(activity.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No recent activities
                  </p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Upcoming Tasks
                </h2>
              </div>
              <div className="p-6">
                {stats?.upcomingTasks && stats.upcomingTasks.length > 0 ? (
                  <div className="space-y-4">
                    {stats.upcomingTasks.slice(0, 5).map((task: any, index: number) => (
                      <div
                        key={index}
                        onClick={() => handleTaskClick(task)}
                        className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {task.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Due:{" "}
                            {task.dueDate
                              ? new Date(task.dueDate).toLocaleDateString()
                              : "No due date"}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            task.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : task.status === "in-progress"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {task.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No upcoming tasks
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => router.push("/user/projects")}
                className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                View Projects
              </button>
              <button
                onClick={() => router.push("/user/tasks")}
                className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                My Tasks
              </button>
              <button
                onClick={() => router.push("/user/profile")}
                className="flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                My Profile
              </button>
            </div>
          </div>
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
            
            canEdit={false}
          />
        )}
      </div>
    </SessionGuard>
  );
}