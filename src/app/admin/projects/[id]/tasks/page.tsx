"use client";

import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";

// Components
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

// Custom Hook
import { useTaskManagement } from "@/hooks/useTaskManagement";

export default function ProjectTasksPage() {
  const router = useRouter();
  const params = useParams();

  // View Mode State
  const [viewMode, setViewMode] = useState<"list" | "board" | "timeline">(
    "list",
  );
  const [isEditing, setIsEditing] = useState(false);

  // Custom Hook - ALL business logic
  const {
    loading,
    isVerified,
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
  } = useTaskManagement(params.id as string);

  // Loading State
  if (!isVerified || loading) {
    return <FitoutLoadingSpinner />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />

      <div className="flex-1 ml-64">
        <AdminHeader />

        <main className="p-8 pt-24">
          {/* Back Button with Project Name */}
          <div className="mb-4">
            <button
              onClick={() => router.push(`/admin/projects/${params.id}`)}
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
          <div className="mb-6 border-b border-gray-200">
            <div className="flex gap-6">
              {["Overview", "Tasks", "Budget", "Documents", "Team"].map(
                (tab) => (
                  <button
                    key={tab}
                    className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                      tab === "Tasks"
                        ? "border-black text-black"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                    onClick={() => {
                      if (tab === "Overview")
                        router.push(`/admin/projects/${params.id}`);
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
                ),
              )}
            </div>
          </div>

          {/* Create Task Button */}
          <div className="flex justify-end mb-6">
            <button
              onClick={() => {
                resetForm();
                setIsCreateModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              <span>Create Task</span>
            </button>
          </div>

          {/* Stats */}
          <TaskStats tasks={tasks} />

          {/* View Toggle */}
          <TaskViewToggle viewMode={viewMode} onViewChange={setViewMode} />

          {/* Views */}
          {viewMode === "list" && (
            <TaskListView
              tasks={tasks}
              onTaskClick={openTaskDetails}
              onEdit={(task) => {
                setSelectedTask(task);
                setIsDetailModalOpen(true);
                setIsEditing(true);
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

          {/* Create Modal */}
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
            onSubmit={createTask}
            saving={saving}
            checkMemberHasActiveTask={checkMemberHasActiveTask}
          />

          {/* Detail/Edit Modal */}
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
            onUpdateTask={updateTask}
            teamMembers={teamMembers}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            selectedFiles={selectedFiles}
            onFileSelect={handleFileSelect}
            onRemoveFile={(index) => {
              setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
            }}
          />
        </main>
      </div>
    </div>
  );
}