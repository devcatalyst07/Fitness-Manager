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
import { hasPermission } from "@/utils/permissions";

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

  // ✅ FIXED: Use useAuth() instead of localStorage for auth check
  const { user, loading: authLoading } = useAuth();

  const [pathname, setPathname] = useState("/user/projects");
  const [loading, setLoading] = useState(true);
  const [roleData, setRoleData] = useState<RoleData | null>(null);
  const [projectName, setProjectName] = useState("");
  const [stats, setStats] = useState<any>(null);
  const [insights, setInsights] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<any[]>([]);
  const [deadlineDays, setDeadlineDays] = useState(7);

  // ✅ FIXED: Role-based redirect using useAuth()
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/");
      return;
    }
    if (!authLoading && user && user.role === "admin") {
      router.replace(`/admin/projects/${params.id}/overview`);
      return;
    }
  }, [user, authLoading, router, params.id]);

  // ✅ FIXED: Fetch permissions + data when user is ready
  useEffect(() => {
    if (user && user.role === "user" && params.id) {
      fetchRolePermissions();
    }
  }, [user, params.id]);

  // Refetch deadlines when filter changes
  useEffect(() => {
    if (user && roleData && params.id) {
      fetchDeadlines();
    }
  }, [deadlineDays]);

  // ✅ FIXED: Use apiClient instead of localStorage token + fetch
  const fetchRolePermissions = async () => {
    try {
      // Get roleId from user object — the auth context should provide this
      // If user.roleId is not available, try fetching user profile
      let roleId = (user as any)?.roleId;

      if (!roleId) {
        // Fallback: fetch user profile to get roleId
        try {
          const profile = await apiClient.get('/api/auth/me');
          roleId = profile?.roleId;
        } catch {
          // If /api/auth/me doesn't return roleId, try /api/users/me
          try {
            const profileAlt = await apiClient.get('/api/users/me');
            roleId = profileAlt?.roleId;
          } catch {
            console.warn('Could not fetch roleId from profile endpoints');
          }
        }
      }

      if (!roleId) {
        console.warn("No roleId found on user object. Loading page without permission checks.");
        // Still load the page data - the API will enforce permissions server-side
        await fetchAllData();
        setLoading(false);
        return;
      }

      const data = await apiClient.get(`/api/roles/${roleId}`);
      setRoleData(data);
      const permissions = data.permissions;

      if (!hasPermission("projects-view-details-overview", permissions)) {
        alert("You do not have permission to access Overview.");
        router.replace("/user/projects");
        return;
      }

      await fetchAllData();
    } catch (error) {
      console.error("Error fetching permissions:", error);
      // Don't redirect on error — try to load page anyway
      // Server-side will enforce permissions
      await fetchAllData();
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

  // ✅ FIXED: All fetch functions now use apiClient
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

  // Show loading while auth is resolving or data is loading
  if (authLoading || loading) return <FitoutLoadingSpinner />;

  // Not authenticated or wrong role
  if (!user || user.role !== "user") return <FitoutLoadingSpinner />;

  // If roleData couldn't be loaded, show page with all tabs visible
  // (server-side will still enforce permissions on API calls)
  const permissions = roleData?.permissions || [];
  const hasRoleData = !!roleData;

  const canViewTasks = !hasRoleData || hasPermission("projects-view-details-task", permissions);
  const canViewBudget = !hasRoleData || hasPermission("projects-view-details-budget", permissions);
  const canViewDocuments = !hasRoleData || hasPermission("projects-view-details-documents", permissions);
  const canViewTeam = !hasRoleData || hasPermission("projects-view-details-team", permissions);
  const canViewOverview = !hasRoleData || hasPermission("projects-view-details-overview", permissions);
  const canAddCalendarEvent = !hasRoleData || hasPermission("projects-calendar-add", permissions);

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
          {roleData && (
            <p className="text-sm text-gray-600">Role: {roleData.name}</p>
          )}
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
      </main>
    </div>
  );
}