"use client";
// USER DASHBOARD - FIXED (No /api/projects/stats call)

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import FitoutLoadingSpinner from "@/components/FitoutLoadingSpinner";
import AdminHeader from "@/components/AdminHeader";
import AdminSidebar from "@/components/AdminSidebar";
import ScopeWorkflowArchitecture from "@/components/ScopeWorkflowArchitecture";
import BrandManagement from "@/components/BrandManagement";
import ThreadsSection from "@/components/ThreadsSection";
import MyTask from "@/components/MyTask";
import TaskDetailModal from "@/components/TaskDetailModal";
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
  brandId?: string | null;
  permissions: Permission[];
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

interface Project {
  _id: string;
  status: string;
  brand: string;
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

export default function UserDashboard() {
  const router = useRouter();
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [roleData, setRoleData] = useState<RoleData | null>(null);
  const [userBrands, setUserBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [projectStats, setProjectStats] = useState<any>(null);
  const [userAssignedProjects, setUserAssignedProjects] = useState<string[]>(
    [],
  );
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
    const roleId = localStorage.getItem("roleId");

    if (!token || role !== "user") {
      localStorage.clear();
      router.replace("/");
    } else if (!roleId) {
      alert("No role assigned to this user. Please contact administrator.");
      router.replace("/");
    } else {
      setIsVerified(true);
      fetchRolePermissions(roleId);
    }
  }, [router]);

  const fetchRolePermissions = async (roleId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/roles/${roleId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setRoleData(data);
        fetchUserBrandsFromProjects();
        // ✅ FIXED: Removed fetchUserStats() call - stats now calculated from projects
      } else {
        alert("Failed to load user permissions.");
        router.replace("/");
      }
    } catch (error) {
      console.error("Error fetching permissions:", error);
      alert("Failed to load user permissions.");
      router.replace("/");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserBrandsFromProjects = async () => {
    try {
      const token = localStorage.getItem("token");
      const projectsResponse = await fetch(`${API_URL}/api/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (projectsResponse.ok) {
        const projects: Project[] = await projectsResponse.json();

        //SAVE USER'S ASSIGNED PROJECT IDs
        const projectIds = projects.map((p: any) => p._id);
        setUserAssignedProjects(projectIds);
        console.log("🎯 User assigned to projects:", projectIds);

        setProjectStats({
          total: projects.length,
          active: projects.filter((p) => p.status === "In Progress").length,
          completed: projects.filter((p) => p.status === "Completed").length,
          planning: projects.filter((p) => p.status === "Planning").length,
        });

        const uniqueBrandNames = [
          ...new Set(projects.map((p: any) => p.brand)),
        ];

        const brandsResponse = await fetch(`${API_URL}/api/brands`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (brandsResponse.ok) {
          const allBrands = await brandsResponse.json();
          const assignedBrands = allBrands.filter((brand: Brand) =>
            uniqueBrandNames.includes(brand.name),
          );

          setUserBrands(assignedBrands);

          if (assignedBrands.length > 0 && !selectedBrand) {
            setSelectedBrand(assignedBrands[0]);
            console.log("Auto-selected brand:", assignedBrands[0].name);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching user brands:", error);
    }
  };

  // ✅ FIXED: Removed fetchUserStats() function entirely

  const handleBrandSelect = (brand: Brand) => {
    setSelectedBrand(brand);
  };

  const handleRefresh = () => {
    fetchUserBrandsFromProjects();
    // ✅ FIXED: No need to call fetchUserStats - it's calculated in fetchUserBrandsFromProjects
  };

  const handleTaskClick = async (task: DashboardTask) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
    setActiveTab("details");

    try {
      const token = localStorage.getItem("token");

      const [commentsRes, logsRes] = await Promise.all([
        fetch(`${API_URL}/api/tasks/${task._id}/comments`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/tasks/${task._id}/activity`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (commentsRes.ok) {
        const commentsData = await commentsRes.json();
        setComments(commentsData);
      }

      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setActivityLogs(logsData);
      }
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

  if (!roleData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            No Permissions
          </h2>
          <p className="text-gray-600">Contact your administrator.</p>
        </div>
      </div>
    );
  }

  const permissions = roleData.permissions;
  const canViewScope = hasPermission("dashboard-scope-workflow", permissions);
  const canCreateScope = hasPermission("dashboard-create-scope", permissions);
  const canViewBrandManagement = hasPermission("dashboard-brand", permissions);
  const canAddBrand = hasPermission("dashboard-brand-add", permissions);
  const canAccessControl = hasPermission("dashboard-brand-access", permissions);
  const canViewBrand = hasPermission("dashboard-brand-view", permissions);
  const canEditBrand = hasPermission("dashboard-brand-edit", permissions);
  const canDeleteBrand = hasPermission("dashboard-brand-delete", permissions);
  const canAddUser = hasPermission("dashboard-brand-view-adduser", permissions);
  const canViewThreads = hasPermission("dashboard-threads", permissions);
  const canAddThread = hasPermission("dashboard-add-threads", permissions);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar userRole="user" permissions={permissions} />
      <AdminHeader />

      <main className="lg:ml-64 mt-16 p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Role: {roleData.name}
            {roleData.brandId === null && (
              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                All Brands Access
              </span>
            )}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">
              Total Projects
            </h3>
            <p className="text-3xl font-bold text-gray-900">
              {projectStats?.total || 0}
            </p>
            <p className="text-sm text-gray-500">
              {projectStats?.total
                ? "Assigned projects"
                : "No projects assigned yet"}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Active</h3>
            <p className="text-3xl font-bold text-gray-900">
              {projectStats?.active || 0}
            </p>
            <p className="text-sm text-gray-500">In progress</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">
              Completed
            </h3>
            <p className="text-3xl font-bold text-gray-900">
              {projectStats?.completed || 0}
            </p>
            <p className="text-sm text-gray-500">Finished projects</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Planning</h3>
            <p className="text-3xl font-bold text-gray-900">
              {projectStats?.planning || 0}
            </p>
            <p className="text-sm text-gray-500">Upcoming projects</p>
          </div>
        </div>

        {/* My Task */}
        <div className="mb-8">
          <MyTask onTaskClick={handleTaskClick} />
        </div>

        {/* Scope Workflow Architecture */}
        {canViewScope && (
          <div className="mb-8">
            <ScopeWorkflowArchitecture
              onRefresh={handleRefresh}
              scopeId=""
              brandName="All Brands"
              canCreateScope={canCreateScope}
              userRole="user"
            />
          </div>
        )}

        {/* Brand Management */}
        {canViewBrandManagement && (
          <div className="mb-8">
            <BrandManagement
              brands={userBrands}
              onRefresh={fetchUserBrandsFromProjects}
              onBrandSelect={handleBrandSelect}
              selectedBrandId={selectedBrand?._id}
              canAddBrand={canAddBrand}
              canAccessControl={canAccessControl}
              canView={canViewBrand}
              canEdit={canEditBrand}
              canDelete={canDeleteBrand}
              canAddUser={canAddUser}
            />
          </div>
        )}

        {/* Threads*/}
        {canViewThreads &&
          (selectedBrand ? (
            <ThreadsSection
              brandId={selectedBrand._id}
              brandName={selectedBrand.name}
              canAddThread={canAddThread}
              userRole="user"
              userAssignedProjects={userAssignedProjects}
            />
          ) : userBrands.length > 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Threads
              </h2>
              <div className="text-center py-12">
                <p className="text-gray-500">Select a brand to view threads</p>
                <p className="text-sm text-gray-400 mt-2">
                  Click on a brand card above to see its threads
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Threads
              </h2>
              <div className="text-center py-12">
                <p className="text-gray-500">No brands assigned</p>
                <p className="text-sm text-gray-400 mt-2">
                  You'll see threads here once assigned to projects
                </p>
              </div>
            </div>
          ))}
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
          canEdit={false}
        />
      )}
    </div>
  );
}
