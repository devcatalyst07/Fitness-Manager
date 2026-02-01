"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import FitoutLoadingSpinner from "@/components/FitoutLoadingSpinner";
import TaskCreateModal from "@/components/TaskCreateModal";
import TaskDetailModal from "@/components/TaskDetailModal";
import TaskStats from "@/components/TaskStats";
import TaskViewToggle from "@/components/TaskViewToggle";
import TaskListView from "@/components/TaskListView";
import TaskBoardView from "@/components/TaskBoardView";
import { TimelineContainer } from "@/components/TimelineComponents";
import { useTaskManagement } from "@/hooks/useTaskManagement";

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

const hasPermission = (
  permissionId: string,
  permissions: Permission[],
): boolean => {
  const check = (perms: Permission[]): boolean => {
    for (const perm of perms) {
      if (perm.id === permissionId && perm.checked) return true;
      if (perm.children && check(perm.children)) return true;
    }
    return false;
  };
  return check(permissions);
};

export default function UserProjectTasksPage() {
  const router = useRouter();
  const params = useParams();
  const [pathname, setPathname] = useState("/user/projects");
  const [isVerified, setIsVerified] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [roleData, setRoleData] = useState<RoleData | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "board" | "timeline">(
    "list",
  );
  const [isEditing, setIsEditing] = useState(false);

  const {
    loading,
    projectName,
    tasks,
    fetchTasks,
    isCreateModalOpen,
    setIsCreateModalOpen,
    isDetailModalOpen,
    setIsDetailModalOpen,
    selectedTask,
    setSelectedTask,
    activeTab,
    setActiveTab,
    formData,
    setFormData,
    saving,
    resetForm,
    teamMembers,
    selectedAssignees,
    setSelectedAssignees,
    checkMemberHasActiveTask,
    comments,
    activityLogs,
    newComment,
    setNewComment,
    addComment,
    openDropdown,
    setOpenDropdown,
    createTask,
    updateTask,
    deleteTask,
    changeTaskStatus,
    openTaskDetails,
    selectedFiles,
    setSelectedFiles,
    handleFileSelect,
    phases,
  } = useTaskManagement(params.id as string);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");
    const roleId = localStorage.getItem("roleId");

    // console.log("Auth check:", { token, role, roleId });
    
    if (!token || role !== "user") {
      // console.log("Redirecting to / — auth failed", { token, role, roleId });
      localStorage.removeItem("token");
      localStorage.removeItem("roleId");
      // localStorage.clear();
      router.replace("/");
    } else if (!roleId) {
      alert("No role assigned. Contact administrator.");
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
        // console.log("Role fetch response ok:", response.ok, "data:", data);
        setRoleData(data);
        const permissions = data.permissions;
          
          // console.log("🔐 Role Data:", data);
          // console.log("🔍 Permissions:", data.permissions);
          // console.log(
          //   "✅ Has Task Permission:",
          //   hasPermission("projects-view-details-task", data.permissions),
          // );

        if (!hasPermission("projects-view-details-task", permissions)) {
          alert("You do not have permission to access Tasks.");
          router.replace("/user/projects");
          return;
        }
      } else {
        alert("Failed to load permissions.");
        router.replace("/");
      }
    } catch (error) {
      console.error("Error fetching permissions:", error);
      alert("Failed to load permissions.");
      router.replace("/");
    } finally {
      setInitialLoading(false);
    }
  };

  if (!isVerified || initialLoading || loading) {
    return <FitoutLoadingSpinner />;
  }

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
  const canCreateTask = hasPermission("projects-task-create", permissions);
  const canViewTasks = hasPermission("projects-view-details-task", permissions);
  const canViewList = hasPermission("projects-task-list", permissions);
  const canViewBoard = hasPermission("projects-task-board", permissions);
  const canViewTimeline = hasPermission("projects-task-timeline", permissions);
  const canViewTaskDetails = hasPermission(
    "projects-task-list-action-view",
    permissions,
  );
  const canEditTask = hasPermission(
    "projects-task-list-action-edit",
    permissions,
  );
  const canDeleteTask = hasPermission(
    "projects-task-list-action-delete",
    permissions,
  );
  const canViewOverview = hasPermission(
    "projects-view-details-overview",
    permissions,
  );
  const canViewBudget = hasPermission(
    "projects-view-details-budget",
    permissions,
  );
  const canViewDocuments = hasPermission(
    "projects-view-details-documents",
    permissions,
  );
  const canViewTeam = hasPermission("projects-view-details-team", permissions);

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
        <div className="mb-4">
          <button
            onClick={() => router.push(`/user/projects/${params.id}`)}
            className="text-gray-600 hover:text-black flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            <span>{projectName || "Back to Project"}</span>
          </button>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Tasks
          </h1>
          <p className="text-sm text-gray-600">Role: {roleData.name}</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200 overflow-x-auto">
          <div className="flex gap-6 whitespace-nowrap">
            {canViewOverview && (
              <button
                onClick={() => router.push(`/user/projects/${params.id}`)}
                className="pb-3 px-1 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700"
              >
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

        {canCreateTask && (
          <div className="flex justify-end mb-6">
            <button
              onClick={() => {
                resetForm();
                setIsCreateModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={20} />
              <span>Create Task</span>
            </button>
          </div>
        )}

        <TaskStats tasks={tasks} />

        <TaskViewToggle
          viewMode={viewMode}
          onViewChange={setViewMode}
          canViewList={canViewList}
          canViewBoard={canViewBoard}
          canViewTimeline={canViewTimeline}
        />

        {viewMode === "list" && canViewList && (
          <TaskListView
            tasks={tasks}
            onTaskClick={canViewTaskDetails ? openTaskDetails : () => {}}
            onEdit={
              canEditTask
                ? (task) => {
                    setSelectedTask(task);
                    setIsDetailModalOpen(true);
                    setIsEditing(true);
                  }
                : undefined
            }
            onDelete={canDeleteTask ? deleteTask : undefined}
            openDropdown={openDropdown}
            setOpenDropdown={setOpenDropdown}
          />
        )}

        {viewMode === "board" && canViewBoard && (
          <TaskBoardView
            tasks={tasks}
            onTaskClick={canViewTaskDetails ? openTaskDetails : () => {}}
            onStatusChange={changeTaskStatus}
          />
        )}

        {viewMode === "timeline" && canViewTimeline && (
          <TimelineContainer
            tasks={tasks}
            onTaskClick={canViewTaskDetails ? openTaskDetails : () => {}}
          />
        )}

        {!canViewList && !canViewBoard && !canViewTimeline && (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-500">No view permissions available</p>
            <p className="text-sm text-gray-400 mt-2">
              Contact administrator for access
            </p>
          </div>
        )}

        {canCreateTask && (
          <TaskCreateModal
            isOpen={isCreateModalOpen}
            onClose={() => {
              setIsCreateModalOpen(false);
              resetForm();
            }}
            formData={formData}
            setFormData={setFormData}
            selectedAssignees={selectedAssignees}
            setSelectedAssignees={setSelectedAssignees}
            teamMembers={teamMembers}
            phases={phases}
            onSubmit={createTask}
            saving={saving}
            checkMemberHasActiveTask={checkMemberHasActiveTask}
          />
        )}

        {canViewTaskDetails && (
          <TaskDetailModal
            isOpen={isDetailModalOpen}
            onClose={() => {
              setIsDetailModalOpen(false);
              setSelectedTask(null);
              setIsEditing(false);
            }}
            task={selectedTask}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            comments={comments}
            activityLogs={activityLogs}
            newComment={newComment}
            setNewComment={setNewComment}
            onAddComment={addComment}
            onUpdateTask={canEditTask ? updateTask : undefined}
            teamMembers={teamMembers}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            selectedFiles={selectedFiles}
            onFileSelect={handleFileSelect}
            onRemoveFile={(index) => {
              setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
            }}
            canEdit={canEditTask}
          />
        )}
      </main>
    </div>
  );
}