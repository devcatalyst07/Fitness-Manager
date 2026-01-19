"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  TrendingUp,
  CheckCircle2,
  Users,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import FitoutLoadingSpinner from "@/components/FitoutLoadingSpinner";
import {
  StatsCard,
} from "@/components/OverviewComponents";
import { InsightsContainer } from "@/components/InsightsComponents";
import { DeadlinesContainer } from "@/components/DeadlineComponents";
import { ActivityContainer } from "@/components/ActivityComponents";
import CalendarWidget from "@/components/CalendarWidget";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://fitout-manager-api.vercel.app";

export default function ProjectOverviewPage() {
  const router = useRouter();
  const params = useParams();
  const [pathname, setPathname] = useState("/admin/projects");
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [stats, setStats] = useState<any>(null);
  const [insights, setInsights] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [upcomingDeadlines, setUpcomingDeadlines] = useState<any[]>([]);
    const [deadlineDays, setDeadlineDays] = useState(7);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");

    if (!token || role !== "admin") {
      localStorage.clear();
      router.replace("/");
    } else {
      setIsVerified(true);
      fetchAllData();
    }
  }, [params.id, router, deadlineDays]);

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
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/projects/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setProjectName(data.projectName);
      }
    } catch (error) {
      console.error("Error fetching project:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/projects/${params.id}/overview/stats`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
      };


  const fetchInsights = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/projects/${params.id}/insights`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (response.ok) {
        const data = await response.json();
        setInsights(data);
      }
    } catch (error) {
      console.error("Error fetching insights:", error);
    }
  };

  const fetchActivity = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/projects/${params.id}/activity?limit=10`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (response.ok) {
        const data = await response.json();
        setRecentActivity(data);
      }
    } catch (error) {
      console.error("Error fetching activity:", error);
    }
  };

  const fetchDeadlines = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/projects/${params.id}/overview/deadlines?days=${deadlineDays}`, // ← Use state
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (response.ok) {
        const data = await response.json();
        setUpcomingDeadlines(data);
      }
    } catch (error) {
      console.error("Error fetching deadlines:", error);
    }
  };

  if (!isVerified || loading) return <FitoutLoadingSpinner />;

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
        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-6">
            {["Overview", "Tasks", "Budget", "Documents", "Team"].map((tab) => (
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
          <CalendarWidget projectId={params.id as string} />
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
          {/* Upcoming Deadlines */}
          <DeadlinesContainer
            deadlines={upcomingDeadlines}
            currentDays={deadlineDays}
            onFilterChange={setDeadlineDays}
            onTaskClick={() =>
              router.push(`/admin/projects/${params.id}/tasks`)
            }
          />

          {/* Recent Activity */}
          <ActivityContainer activities={recentActivity} loading={loading} />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => router.push(`/admin/projects/${params.id}/budget`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
             View Budget
          </button>
          <button
            onClick={() => router.push(`/admin/projects/${params.id}/tasks`)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
             View Tasks
          </button>
          <button
            onClick={() =>
              router.push(`/admin/projects/${params.id}/approvals`)
            }
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
             View Approvals
          </button>
        </div>
      </main>
    </div>
  );
}