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
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import FitoutLoadingSpinner from "@/components/FitoutLoadingSpinner";
import { StatsCard } from "@/components/OverviewComponents";
import { InsightsContainer } from "@/components/InsightsComponents";
import { DeadlinesContainer } from "@/components/DeadlineComponents";
import { ActivityContainer } from "@/components/ActivityComponents";
import CalendarWidget from "@/components/CalendarWidget";
import { hasPermission } from "@/utils/permissions";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://fitout-manager-api.vercel.app";

interface Permission {
  id: string;
  label: string;
  checked: boolean;
  children?: Permission[];
}

interface RoleData {
  _id: string;
  name: string;
  permissions: Permission[];
}

export default function UserProjectOverviewPage() {
  const router = useRouter();
  const params = useParams();
  const [pathname, setPathname] = useState("/user/projects");
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [roleData, setRoleData] = useState<RoleData | null>(null);
  const [projectName, setProjectName] = useState("");
  const [stats, setStats] = useState<any>(null);
  const [insights, setInsights] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<any[]>([]);
  const [deadlineDays, setDeadlineDays] = useState(7);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");
    const roleId = localStorage.getItem("roleId");

    if (!token || role !== "user") {
      localStorage.clear();
      router.replace("/");
    } else if (!roleId) {
      alert("No role assigned. Contact administrator.");
      router.replace("/");
    } else {
      setIsVerified(true);
      fetchRolePermissions(roleId);
    }
  }, [params.id, router, deadlineDays]);

  const fetchRolePermissions = async (roleId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/roles/${roleId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setRoleData(data);
        const permissions = data.permissions;

        if (!hasPermission("projects-view-details-overview", permissions)) {
          alert("You do not have permission to access Overview.");
          router.replace("/user/projects");
          return;
        }

        fetchAllData();
      } else {
        alert("Failed to load permissions.");
        router.replace("/");
      }
    } catch (error) {
      console.error("Error fetching permissions:", error);
      alert("Failed to load permissions.");
      router.replace("/");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllData = async () => {
    await Promise.all([
      fetchProject(),
      fetchStats(),
      fetchInsights(),
      fetchActivity(),
      fetchDeadlines(),
    ]);
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
        `${API_URL}/api/projects/${params.id}/overview/deadlines?days=${deadlineDays}`,
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

  if (!roleData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            No Permissions
          </h2>
          <p className="text-gray-600">Contact administrator.</p>
        </div>
      </div>
    );
  }

  const permissions = roleData.permissions;
  const canViewTasks = hasPermission("projects-view-details-task", permissions);
  const canViewBudget = hasPermission(
    "projects-view-details-budget",
    permissions,
  );
  const canViewDocuments = hasPermission(
    "projects-view-details-documents",
    permissions,
  );
  const canViewTeam = hasPermission("projects-view-details-team", permissions);
  const canViewOverview = hasPermission(
    "projects-view-details-overview",
    permissions,
  );
  const canAddCalendarEvent = hasPermission(
    "projects-calendar-add",
    permissions,
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar
        pathname={pathname}
        setPathname={setPathname}
        userRole="user"
        permissions={permissions}
      />
      <AdminHeader />

      <main className="lg:ml-64 mt-16 p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <button
            onClick={() => router.push("/user/projects")}
            className="text-gray-600 hover:text-black mb-4 flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            <span>Back to Projects</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {projectName} - Overview
          </h1>
          <p className="text-sm text-gray-600">Role: {roleData.name}</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200 overflow-x-auto">
          <div className="flex gap-6 whitespace-nowrap">
            {canViewOverview && (
              <button className="pb-3 px-1 text-sm font-medium border-b-2 border-black text-black">
                Overview
              </button>
            )}
            {canViewTasks && (
              <button
                onClick={() => router.push(`/user/projects/${params.id}/tasks`)}
                className="pb-3 px-1 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700"
              >
                Tasks
              </button>
            )}
            {canViewBudget && (
              <button
                onClick={() =>
                  router.push(`/user/projects/${params.id}/budget`)
                }
                className="pb-3 px-1 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700"
              >
                Budget
              </button>
            )}
            {canViewDocuments && (
              <button
                onClick={() =>
                  router.push(`/user/projects/${params.id}/documents`)
                }
                className="pb-3 px-1 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700"
              >
                Documents
              </button>
            )}
            {canViewTeam && (
              <button
                onClick={() => router.push(`/user/projects/${params.id}/team`)}
                className="pb-3 px-1 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700"
              >
                Team
              </button>
            )}
          </div>
        </div>

        <div className="mb-6">
          <CalendarWidget
            projectId={params.id as string}
            canAddEvent={canAddCalendarEvent}
            userRole="user"
          />
        </div>

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

        <InsightsContainer
          insights={insights}
          onAction={(url) => router.push(url)}
          onRefresh={fetchInsights}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <DeadlinesContainer
            deadlines={upcomingDeadlines}
            currentDays={deadlineDays}
            onFilterChange={setDeadlineDays}
            onTaskClick={() =>
              canViewTasks && router.push(`/user/projects/${params.id}/tasks`)
            }
          />

          <ActivityContainer activities={recentActivity} loading={loading} />
        </div>

        {/* <div className="flex flex-col sm:flex-row gap-3">
          {canViewBudget && (
            <button
              onClick={() => router.push(`/user/projects/${params.id}/budget`)}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              View Budget
            </button>
          )}
          {canViewTasks && (
            <button
              onClick={() => router.push(`/user/projects/${params.id}/tasks`)}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              View Tasks
            </button>
          )}
        </div> */}
      </main>
    </div>
  );
}
