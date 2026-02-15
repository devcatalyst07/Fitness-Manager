"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  TrendingUp,
  CheckCircle2,
  Users,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/axios";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import FitoutLoadingSpinner from "@/components/FitoutLoadingSpinner";
import { StatsCard } from "@/components/OverviewComponents";
import { InsightsContainer } from "@/components/InsightsComponents";
import { DeadlinesContainer } from "@/components/DeadlineComponents";
import { ActivityContainer } from "@/components/ActivityComponents";
import CalendarWidget from "@/components/CalendarWidget";

export default function ProjectOverviewPage() {
  const router = useRouter();
  const params = useParams();

  const { user, loading: authLoading } = useAuth();

  const [pathname, setPathname] = useState("/admin/projects");
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState("");
  const [stats, setStats] = useState<any>(null);
  const [insights, setInsights] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<any[]>([]);
  const [deadlineDays, setDeadlineDays] = useState(7);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/");
      return;
    }
    if (!authLoading && user && user.role !== "admin") {
      router.replace("/user/projects");
      return;
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.role === "admin" && params.id) {
      fetchAllData();
    }
  }, [user, params.id, deadlineDays]);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchProject(),
      fetchStats(),
      fetchInsights(),
      fetchActivity(),
      fetchDeadlines(),
    ]);
    setLoading(false);
  };

  const fetchProject = async () => {
    try {
      const data = await apiClient.get(`/api/projects/${params.id}`);
      setProjectName(data.projectName);
    } catch (error) {
      console.error("Error fetching project:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await apiClient.get(
        `/api/projects/${params.id}/overview/stats`
      );
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchInsights = async () => {
    try {
      const data = await apiClient.get(
        `/api/projects/${params.id}/insights`
      );
      setInsights(data);
    } catch (error) {
      console.error("Error fetching insights:", error);
    }
  };

  const fetchActivity = async () => {
    try {
      const data = await apiClient.get(
        `/api/projects/${params.id}/activity?limit=10`
      );
      setRecentActivity(data);
    } catch (error) {
      console.error("Error fetching activity:", error);
    }
  };

  const fetchDeadlines = async () => {
    try {
      const data = await apiClient.get(
        `/api/projects/${params.id}/overview/deadlines?days=${deadlineDays}`
      );
      setUpcomingDeadlines(data);
    } catch (error) {
      console.error("Error fetching deadlines:", error);
    }
  };

  if (authLoading || loading) return <FitoutLoadingSpinner />;

  if (!user || user.role !== "admin") return <FitoutLoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar pathname={pathname} setPathname={setPathname} />
      <AdminHeader />

      <main className="lg:ml-64 mt-16 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/admin/projects")}
            className="text-gray-600 hover:text-black mb-4 flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            <span>Back to Projects</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {projectName} - Overview
          </h1>
          <p className="text-sm text-gray-600">
            Project dashboard showing budget performance, task progress, and
            approval status
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200 overflow-x-auto">
          <div className="flex gap-6 whitespace-nowrap">
            {["Overview", "Tasks", "Budget", "Tender", "Documents", "Team"].map((tab) => (
              <button
                key={tab}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                  tab === "Overview"
                    ? "border-black text-black"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => {
                  if (tab === "Tasks")
                    router.push(`/admin/projects/${params.id}/tasks`);
                  if (tab === "Budget")
                    router.push(`/admin/projects/${params.id}/budget`);
                  if (tab === "Tender")
                    router.push(`/admin/projects/${params.id}/tender`);
                  if (tab === "Documents")
                    router.push(`/admin/projects/${params.id}/documents`);
                  if (tab === "Team")
                    router.push(`/admin/projects/${params.id}/team`);
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Calendar Widget */}
        <div className="mb-6">
          <CalendarWidget
            projectId={params.id as string}
            canAddEvent={true}
            userRole="admin"
          />
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatsCard
              title="Budget Utilisation"
              value={`${stats.budgetUtilization.toFixed(1)}%`}
              icon={TrendingUp}
            />
            <StatsCard
              title="Variance"
              value={`${stats.variance.toFixed(1)}%`}
              icon={AlertCircle}
            />
            <StatsCard
              title="Tasks Completed"
              value={`${stats.tasksCompleted.toFixed(1)}%`}
              icon={CheckCircle2}
              subtitle={`${stats.completedTasks} of ${stats.totalTasks} tasks`}
            />
            <StatsCard
              title="Open Approvals"
              value={stats.openApprovals}
              icon={Users}
            />
          </div>
        )}

        {/* Project Insights */}
        <InsightsContainer
          insights={insights}
          onAction={(url) => router.push(url)}
          onRefresh={fetchInsights}
        />

        {/* Bottom Section: Upcoming Deadlines & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <DeadlinesContainer
            deadlines={upcomingDeadlines}
            currentDays={deadlineDays}
            onFilterChange={setDeadlineDays}
            onTaskClick={() =>
              router.push(`/admin/projects/${params.id}/tasks`)
            }
          />
          <ActivityContainer activities={recentActivity} loading={loading} />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => router.push(`/admin/projects/${params.id}/budget`)}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            View Budget
          </button>
          <button
            onClick={() => router.push(`/admin/projects/${params.id}/tasks`)}
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
          >
            View Tasks
          </button>
          <button
            onClick={() =>
              router.push(`/admin/projects/${params.id}/approvals`)
            }
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
          >
            View Approvals
          </button>
        </div>
      </main>
    </div>
  );
}