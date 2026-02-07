"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Plus, Settings } from "lucide-react";

// Components
import UserSidebar from "@/components/AdminSidebar";
import UserHeader from "@/components/AdminHeader";
import FitoutLoadingSpinner from "@/components/FitoutLoadingSpinner";
import TaskCreateModal from "@/components/TaskCreateModal";
import TaskDetailModal from "@/components/TaskDetailModal";
import TaskStats from "@/components/TaskStats";
import TaskListView from "@/components/TaskListView";
import TaskBoardView from "@/components/TaskBoardView";
import TaskPhaseView from "@/components/TaskPhaseView";
import PhaseManagementModal from "@/components/PhaseManagementModal";
import { TimelineContainer } from "@/components/TimelineComponents";

// Custom Hook
import { useTaskManagement } from "@/hooks/useTaskManagement";
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

export default function UserProjectTasksPage() {
  const router = useRouter();
  const params = useParams();

  // View Mode State
  const [viewMode, setViewMode] = useState<"list" | "board" | "timeline" | "phase">(
    "phase"
  );

  // Auth and Permission State
  const [isVerified, setIsVerified] = useState(false);
  const [roleData, setRoleData] = useState<RoleData | null>(null);

  // Custom Hook - ALL business logic
  const {
    loading,
    isVerified: hookIsVerified,
    projectName,
    tasks,
    isCreateModalOpen,
    setIsCreateModalOpen,
    isDetailModalOpen,
    setIsDetailModalOpen,
    selectedTask,
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
    uploadingFiles,
    // Phase management
    phases,
    isPhaseModalOpen,
    setIsPhaseModalOpen,
    createPhase,
    updatePhase,
    deletePhase,
  } = useTaskManagement(params.id as string);

  // Auth check
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
      }
    } catch (error) {
      console.error("Error fetching role permissions:", error);
    }
  };

  // Check if user can create tasks based on permissions
  const canCreateTask = roleData
    ? hasPermission("projects-view-details-task", roleData.permissions)
    : false;

  // Loading State
  if (!isVerified || loading) {
    return <FitoutLoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <UserSidebar />

      <UserHeader />

      <main className="lg:ml-64 mt-16 p-4 sm:p-6 lg:p-8">
        {/* Back Button with Project Name */}
        <div className="mb-4">
          <button
            onClick={() => router.push(`/user/projects/${params.id}`)}
            className="text-gray-600 hover:text-black flex items-center gap-2 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>{projectName || "Back to Project"}</span>
          </button>
        </div>

        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Tasks
          </h1>
          <p className="text-sm text-gray-600">
            Track and manage all project tasks
          </p>
        </div>

        {/* Project Navigation Tabs */}
        <div className="mb-6 border-b border-gray-200 overflow-x-auto">
          <div className="flex gap-6 whitespace-nowrap">
            {["Overview", "Tasks", "Budget", "Documents", "Team"].map((tab) => (
              <button
                key={tab}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                  tab === "Tasks"
                    ? "border-black text-black"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => {
                  if (tab === "Overview")
                    router.push(`/user/projects/${params.id}`);
                  if (tab === "Budget")
                    router.push(`/user/projects/${params.id}/budget`);
                  if (tab === "Documents")
                    router.push(`/user/projects/${params.id}/documents`);
                  if (tab === "Team")
                    router.push(`/user/projects/${params.id}/team`);
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
          <button
            onClick={() => setIsPhaseModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Settings size={20} />
            <span>View Phases</span>
          </button>

          {canCreateTask && (
            <button
              onClick={() => {
                resetForm();
                setIsCreateModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              <span>Create Task</span>
            </button>
          )}
        </div>

        {/* Stats */}
        <TaskStats tasks={tasks} />

        {/* View Toggle */}
        <div className="mb-6">
          <div className="inline-flex bg-white border border-gray-200 rounded-lg p-1">
            <button
              onClick={() => setViewMode("phase")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === "phase"
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              Phase View
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === "list"
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode("board")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === "board"
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              Board View
            </button>
            <button
              onClick={() => setViewMode("timeline")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === "timeline"
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              Timeline
            </button>
          </div>
        </div>

        {/* Views */}
        {viewMode === "phase" && (
          <TaskPhaseView
            tasks={tasks}
            phases={phases}
            onTaskClick={openTaskDetails}
            onDelete={deleteTask}
            openDropdown={openDropdown}
            setOpenDropdown={setOpenDropdown}
          />
        )}

        {viewMode === "list" && (
          <TaskListView
            tasks={tasks}
            onTaskClick={openTaskDetails}
            onEdit={(task) => {
              openTaskDetails(task);
            }}
            onDelete={deleteTask}
            openDropdown={openDropdown}
            setOpenDropdown={setOpenDropdown}
          />
        )}

        {viewMode === "board" && (
          <TaskBoardView
            tasks={tasks}
            onTaskClick={openTaskDetails}
            onStatusChange={changeTaskStatus}
          />
        )}

        {viewMode === "timeline" && (
          <TimelineContainer tasks={tasks} onTaskClick={openTaskDetails} />
        )}

        {/* Phase Management Modal */}
        <PhaseManagementModal
          isOpen={isPhaseModalOpen}
          onClose={() => setIsPhaseModalOpen(false)}
          phases={phases}
          onCreatePhase={createPhase}
          onUpdatePhase={updatePhase}
          onDeletePhase={deletePhase}
        />

        {/* Create Modal */}
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
            tasks={tasks}
            onSubmit={createTask}
            saving={saving}
            checkMemberHasActiveTask={checkMemberHasActiveTask}
          />
        )}

        {/* Detail/Edit Modal */}
        <TaskDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
          }}
          task={selectedTask}
          onUpdate={updateTask}
          onDelete={deleteTask}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          comments={comments}
          activityLogs={activityLogs}
          newComment={newComment}
          setNewComment={setNewComment}
          onAddComment={addComment}
          selectedFiles={selectedFiles}
          setSelectedFiles={setSelectedFiles}
          handleFileSelect={handleFileSelect}
          uploadingFiles={uploadingFiles}
          phases={phases}
          allTasks={tasks}
          canEdit={canCreateTask}
        />
      </main>
    </div>
  );
}