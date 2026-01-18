"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  List,
  LayoutGrid,
  X,
  Calendar,
  Flag,
  Users,
  FileText,
  Clock,
} from "lucide-react";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import FitoutLoadingSpinner from "@/components/FitoutLoadingSpinner";
import TaskCreateModal from "@/components/TaskCreateModal";
import { TimelineContainer } from "@/components/TimelineComponents";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://fitout-manager-api.vercel.app";

interface Task {
  _id: string;
  title: string;
  description?: string;
  status: "Backlog" | "In Progress" | "Blocked" | "Done";
  priority: "Low" | "Medium" | "High" | "Critical";
  assigneeEmail?: string;
  assigneeName?: string;
  assignees: { email: string; name: string }[];
  startDate?: string;
  dueDate?: string;
  progress: number;
  estimateHours?: number;
}

export default function ProjectTasksPage() {
  const router = useRouter();
  const params = useParams();
  const [pathname, setPathname] = useState("/admin/projects");
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "board" | "timeline">(
    "list",
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projectName, setProjectName] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<
    { email: string; name: string }[]
  >([]);
  const [comments, setComments] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<
    "details" | "comments" | "activity"
  >("details");
  const [newComment, setNewComment] = useState("");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "",
    priority: "",
    assignees: [] as { email: string; name: string }[],
    startDate: "",
    dueDate: "",
    progress: 0,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");

    if (!token || role !== "admin") {
      localStorage.clear();
      router.replace("/");
    } else {
      setIsVerified(true);
      fetchProject();
      fetchTasks();
      fetchTeamMembers();
    }
  }, [params.id, router]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".dropdown-menu")) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/projects/${params.id}/tasks`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/projects/${params.id}/team`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (response.ok) {
        const data = await response.json();
        setTeamMembers(data);
      }
    } catch (error) {
      console.error("Error fetching team members:", error);
    }
  };

  const fetchComments = async (taskId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/tasks/${taskId}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const fetchActivityLogs = async (taskId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/tasks/${taskId}/activity-logs`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (response.ok) {
        const data = await response.json();
        setActivityLogs(data);
      }
    } catch (error) {
      console.error("Error fetching activity logs:", error);
    }
  };

  // file upload handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setSelectedFiles([...selectedFiles, ...Array.from(files)]);
    }
  };

  const uploadFiles = async (files: File[]) => {
    const uploadedFiles = [];

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_URL}/api/upload`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          uploadedFiles.push(data.file);
        } else {
          console.error("Failed to upload:", file.name);
        }
      } catch (error) {
        console.error("Upload error:", error);
      }
    }

    return uploadedFiles;
  };

  // add comment handler
  const handleAddComment = async () => {
    if (!selectedTask || (!newComment.trim() && selectedFiles.length === 0))
      return;

    setUploadingFiles(true);

    try {
      // Upload files first
      let attachments: any[] = [];
      if (selectedFiles.length > 0) {
        attachments = await uploadFiles(selectedFiles);
      }

      // Then create comment with attachments
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/tasks/${selectedTask._id}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            comment: newComment,
            attachments: attachments,
          }),
        },
      );

      if (response.ok) {
        await fetchComments(selectedTask._id);
        await fetchActivityLogs(selectedTask._id);
        setNewComment("");
        setSelectedFiles([]);
      } else {
        const error = await response.json();
        alert(error.message || "Failed to add comment");
      }
    } catch (error) {
      console.error("Add comment error:", error);
      alert("Failed to add comment");
    } finally {
      setUploadingFiles(false);
    }
  };

  const checkMemberHasActiveTask = (memberEmail: string) => {
    return tasks.some((task) => {
      if (task.assignees && task.assignees.length > 0) {
        return (
          task.assignees.some((assignee) => assignee.email === memberEmail) &&
          task.status !== "Done"
        );
      }
      if (task.assigneeEmail) {
        return task.assigneeEmail === memberEmail && task.status !== "Done";
      }
      return false;
    });
  };

  const handleCreateTask = async () => {
    if (!formData.title || formData.assignees.length === 0) {
      alert("Please fill in title and select at least one assignee");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/projects/${params.id}/tasks`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Backend Error:", errorData);
        alert(errorData.message || "Failed to create task");
        setSaving(false);
        return;
      }

      if (response.ok) {
        await fetchTasks();
        setIsCreateModalOpen(false);
        setFormData({
          title: "",
          description: "",
          status: "",
          priority: "",
          assignees: [],
          startDate: "",
          dueDate: "",
          progress: 0,
        });
        setSelectedAssignees([]);
        alert("Task created successfully!");
      }
    } catch (error) {
      console.error("Create task error:", error);
      alert("Failed to create task");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTask = async () => {
    if (!selectedTask) return;

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/projects/${params.id}/tasks/${selectedTask._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(selectedTask),
        },
      );

      if (response.ok) {
        await fetchTasks();
        setIsDetailModalOpen(false);
        alert("Task updated successfully!");
      } else {
        const error = await response.json();
        alert(error.message || "Failed to update task");
      }
    } catch (error) {
      console.error("Update task error:", error);
      alert("Failed to update task");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/projects/${params.id}/tasks/${taskId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        await fetchTasks();
        alert("Task deleted successfully!");
      }
    } catch (error) {
      console.error("Delete task error:", error);
      alert("Failed to delete task");
    }
  };

  const statusColors: { [key: string]: string } = {
    Backlog: "bg-gray-100 text-gray-700",
    "In Progress": "bg-blue-100 text-blue-700",
    Blocked: "bg-red-100 text-red-700",
    Done: "bg-green-100 text-green-700",
  };

  const priorityColors: { [key: string]: string } = {
    Low: "bg-gray-100 text-gray-700",
    Medium: "bg-yellow-100 text-yellow-700",
    High: "bg-orange-100 text-orange-700",
    Critical: "bg-red-100 text-red-700",
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getTasksByStatus = (status: string) =>
    tasks.filter((task) => task.status === status);

  if (!isVerified || loading) return <FitoutLoadingSpinner />;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "Done").length;
  const inProgressTasks = tasks.filter(
    (t) => t.status === "In Progress",
  ).length;
  const blockedTasks = tasks.filter((t) => t.status === "Blocked").length;
  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar pathname={pathname} setPathname={setPathname} />
      <AdminHeader />

      <main className="lg:ml-64 mt-16 p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <button
            onClick={() => router.push(`/admin/projects/${params.id}`)}
            className="text-gray-600 hover:text-black mb-4 flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            <span>{projectName || "Back to Project"}</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Tasks
          </h1>
          <p className="text-sm text-gray-600">
            Track and manage all project tasks
          </p>
        </div>

        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-6">
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
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2 bg-white border border-gray-200 rounded-lg p-1 text-black">
            <button
              onClick={() => setViewMode("list")}
              className={`px-4 py-2 rounded flex items-center gap-2 ${
                viewMode === "list" ? "bg-gray-100" : "text-gray-600"
              }`}
            >
              <List size={18} />
              <span>List</span>
            </button>
            <button
              onClick={() => setViewMode("board")}
              className={`px-4 py-2 rounded flex items-center gap-2 ${
                viewMode === "board" ? "bg-gray-100" : "text-gray-600"
              }`}
            >
              <LayoutGrid size={18} />
              <span>Board</span>
            </button>
            <button
              onClick={() => setViewMode("timeline")}
              className={`px-4 py-2 rounded flex items-center gap-2 ${
                viewMode === "timeline" ? "bg-gray-100" : "text-gray-600"
              }`}
            >
              <Calendar size={18} />
              <span>Timeline</span>
            </button>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus size={18} />
            <span>New Task</span>
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-gray-900 mb-1">
              {totalTasks}
            </p>
            <p className="text-sm text-gray-600">Total</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-green-600 mb-1">
              {completedTasks}
            </p>
            <p className="text-sm text-gray-600">Completed</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-blue-600 mb-1">
              {inProgressTasks}
            </p>
            <p className="text-sm text-gray-600">In Progress</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-red-600 mb-1">
              {blockedTasks}
            </p>
            <p className="text-sm text-gray-600">Blocked</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-purple-600 mb-1">
              {completionRate}%
            </p>
            <p className="text-sm text-gray-600">Completion</p>
          </div>
        </div>

        {tasks.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No tasks yet
            </h3>
            <p className="text-gray-600 mb-4">
              Get started by creating your first task
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg"
            >
              <Plus size={20} />
              <span>Create Task</span>
            </button>
          </div>
        ) : viewMode === "list" ? (
          <div className="bg-white rounded-lg border border-gray-200 overflow-visible">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Task
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date Started
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Progress
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {tasks.map((task) => (
                    <tr key={task._id} className="hover:bg-gray-50">
                      <td
                        className="px-6 py-4 cursor-pointer"
                        onClick={() => {
                          setSelectedTask(task);
                          setIsDetailModalOpen(true);
                        }}
                      >
                        <div className="font-medium text-gray-900">
                          {task.title}
                        </div>
                        {task.description && (
                          <div className="text-sm text-gray-500">
                            {task.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            statusColors[task.status]
                          }`}
                        >
                          {task.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            priorityColors[task.priority]
                          }`}
                        >
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {task.assignees && task.assignees.length > 0 ? (
                            task.assignees.map((assignee, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700"
                              >
                                {assignee.name}
                              </span>
                            ))
                          ) : task.assigneeName ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
                              {task.assigneeName}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-500">
                              No assignees
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {formatDate(task.startDate)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {formatDate(task.dueDate)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${task.progress}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 w-12 text-right">
                            {task.progress}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative dropdown-menu">
                          <button
                            id={`menu-button-${task._id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdown(
                                openDropdown === task._id ? null : task._id,
                              );
                            }}
                            className="text-gray-500 hover:text-gray-700 p-1 hover:bg-gray-100 rounded"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </button>

                          {openDropdown === task._id && (
                            <div
                              className="fixed bg-white rounded-lg shadow-xl border border-gray-200 z-50 w-48"
                              style={{
                                top: `${
                                  (document
                                    .getElementById(`menu-button-${task._id}`)
                                    ?.getBoundingClientRect()?.bottom || 0) + 8
                                }px`,
                                left: `${
                                  (document
                                    .getElementById(`menu-button-${task._id}`)
                                    ?.getBoundingClientRect()?.right || 0) - 192
                                }px`,
                              }}
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTask(task);
                                  setActiveTab("details");
                                  setIsDetailModalOpen(true);
                                  fetchComments(task._id);
                                  fetchActivityLogs(task._id);
                                  setOpenDropdown(null);
                                }}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg"
                              >
                                View Details
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTask(task._id);
                                  setOpenDropdown(null);
                                }}
                                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : viewMode === "board" ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {["Backlog", "In Progress", "Blocked", "Done"].map((status) => (
              <div key={status} className="bg-gray-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">{status}</h3>
                  <span className="bg-gray-200 px-2 py-1 rounded text-sm">
                    {getTasksByStatus(status).length}
                  </span>
                </div>
                <div className="space-y-3">
                  {getTasksByStatus(status).map((task) => (
                    <div
                      key={task._id}
                      onClick={() => {
                        setSelectedTask(task);
                        setIsDetailModalOpen(true);
                      }}
                      className="bg-white rounded-lg p-4 border cursor-pointer hover:shadow-md"
                    >
                      <h4 className="font-medium mb-2">{task.title}</h4>
                      {task.description && (
                        <p className="text-sm text-gray-600 mb-3">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            priorityColors[task.priority]
                          }`}
                        >
                          {task.priority}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(task.dueDate)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : viewMode === "timeline" ? (
          <TimelineContainer
            tasks={tasks}
            onTaskClick={(task) => {
              setSelectedTask(task);
              setActiveTab("details");
              setIsDetailModalOpen(true);
              fetchComments(task._id);
              fetchActivityLogs(task._id);
            }}
          />
        ) : null}

        {/* Create Modal */}
        <TaskCreateModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          formData={formData}
          setFormData={setFormData}
          selectedAssignees={selectedAssignees}
          setSelectedAssignees={setSelectedAssignees}
          teamMembers={teamMembers}
          onSubmit={handleCreateTask}
          saving={saving}
          checkMemberHasActiveTask={checkMemberHasActiveTask}
        />
        {/* Detail Modal - 3 TABS */}
        {isDetailModalOpen && selectedTask && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-5xl rounded-lg max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedTask.title}
                  </h2>
                  <button
                    onClick={() => setIsDetailModalOpen(false)}
                    className="text-gray-400 hover:text-black"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-4 mt-4 border-b border-gray-200">
                  <button
                    onClick={() => setActiveTab("details")}
                    className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === "details"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Details
                  </button>
                  <button
                    onClick={() => setActiveTab("comments")}
                    className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === "comments"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Comments ({comments.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("activity")}
                    className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === "activity"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Activity Logs ({activityLogs.length})
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* ========== DETAILS TAB ========== */}
                {activeTab === "details" && (
                  <div className="space-y-6">
                    {/* Title */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <FileText size={16} className="text-gray-500" />
                        Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={selectedTask.title}
                        onChange={(e) =>
                          setSelectedTask({
                            ...selectedTask,
                            title: e.target.value,
                          })
                        }
                        placeholder="Enter task title..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <FileText size={16} className="text-gray-500" />
                        Description
                      </label>
                      <textarea
                        value={selectedTask.description || ""}
                        onChange={(e) =>
                          setSelectedTask({
                            ...selectedTask,
                            description: e.target.value,
                          })
                        }
                        rows={4}
                        placeholder="Provide task details and requirements..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                      />
                    </div>

                    {/* Status & Priority */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                          <Flag size={16} className="text-gray-500" />
                          Status
                        </label>
                        <select
                          value={selectedTask.status}
                          onChange={(e) =>
                            setSelectedTask({
                              ...selectedTask,
                              status: e.target.value as any,
                            })
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white cursor-pointer"
                        >
                          <option value="Backlog">📋 Backlog</option>
                          <option value="In Progress">🔄 In Progress</option>
                          <option value="Blocked">⚠️ Blocked</option>
                          <option value="Done">✅ Done</option>
                        </select>
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                          <Flag size={16} className="text-gray-500" />
                          Priority
                        </label>
                        <select
                          value={selectedTask.priority}
                          onChange={(e) =>
                            setSelectedTask({
                              ...selectedTask,
                              priority: e.target.value as any,
                            })
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white cursor-pointer"
                        >
                          <option value="Low">🟢 Low</option>
                          <option value="Medium">🟡 Medium</option>
                          <option value="High">🟠 High</option>
                          <option value="Critical">🔴 Critical</option>
                        </select>
                      </div>
                    </div>

                    {/* Assignees */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <Users size={16} className="text-gray-500" />
                        Assignees ({selectedTask.assignees?.length || 0})
                      </label>

                      {/* Add assignee dropdown */}
                      <select
                        onChange={(e) => {
                          const selectedMember = teamMembers.find(
                            (member) => member.userId.email === e.target.value,
                          );

                          if (selectedMember) {
                            const alreadyAssigned = selectedTask.assignees.some(
                              (a) => a.email === selectedMember.userId.email,
                            );

                            if (alreadyAssigned) {
                              alert("This member is already assigned!");
                              return;
                            }

                            const newAssignee = {
                              email: selectedMember.userId.email,
                              name: selectedMember.userId.name,
                            };

                            setSelectedTask({
                              ...selectedTask,
                              assignees: [
                                ...selectedTask.assignees,
                                newAssignee,
                              ],
                            });
                          }

                          e.target.value = "";
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white cursor-pointer mb-4"
                      >
                        <option value="">+ Add team member</option>
                        {teamMembers
                          .filter((member) => member.status === "active")
                          .map((member) => (
                            <option
                              key={member._id}
                              value={member.userId.email}
                            >
                              {member.userId.name}
                            </option>
                          ))}
                      </select>

                      {/* Display assignees */}
                      {selectedTask.assignees &&
                      selectedTask.assignees.length > 0 ? (
                        <div className="space-y-3">
                          {selectedTask.assignees.map((assignee, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-xl"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                                  {assignee.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase()
                                    .slice(0, 2)}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {assignee.name}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {assignee.email}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  const updated = selectedTask.assignees.filter(
                                    (_, i) => i !== idx,
                                  );
                                  setSelectedTask({
                                    ...selectedTask,
                                    assignees: updated,
                                  });
                                }}
                                className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all"
                              >
                                <X size={18} />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 flex items-center gap-2 py-4">
                          <Users size={16} />
                          No team members assigned yet
                        </p>
                      )}
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                          <Calendar size={16} className="text-gray-500" />
                          Start Date & Time
                        </label>
                        <input
                          type="datetime-local"
                          value={
                            selectedTask.startDate
                              ? new Date(selectedTask.startDate)
                                  .toISOString()
                                  .slice(0, 16)
                              : ""
                          }
                          onChange={(e) =>
                            setSelectedTask({
                              ...selectedTask,
                              startDate: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                          <Calendar size={16} className="text-gray-500" />
                          Due Date & Time
                        </label>
                        <input
                          type="datetime-local"
                          value={
                            selectedTask.dueDate
                              ? new Date(selectedTask.dueDate)
                                  .toISOString()
                                  .slice(0, 16)
                              : ""
                          }
                          onChange={(e) =>
                            setSelectedTask({
                              ...selectedTask,
                              dueDate: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>

                    {/* Progress */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <Clock size={16} className="text-gray-500" />
                        Progress: {selectedTask.progress}%
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={selectedTask.progress}
                          onChange={(e) =>
                            setSelectedTask({
                              ...selectedTask,
                              progress: parseInt(e.target.value) || 0,
                            })
                          }
                          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={selectedTask.progress}
                          onChange={(e) =>
                            setSelectedTask({
                              ...selectedTask,
                              progress: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="mt-3 bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${selectedTask.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ========== COMMENTS TAB ========== */}
                {activeTab === "comments" && (
                  <div className="space-y-4">
                    {/* Comments List */}
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {comments.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <p>No comments yet. Be the first to comment!</p>
                        </div>
                      ) : (
                        comments.map((comment) => (
                          <div
                            key={comment._id}
                            className="bg-gray-50 rounded-lg p-4"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-medium text-gray-900">
                                  {comment.userName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(comment.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <p className="text-gray-700 mb-2">
                              {comment.comment}
                            </p>
                            {/* File Attachments */}
                            {comment.attachments &&
                              comment.attachments.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <p className="text-xs font-medium text-gray-600 mb-2">
                                    Attachments ({comment.attachments.length}):
                                  </p>
                                  <div className="space-y-1">
                                    {comment.attachments.map(
                                      (file: any, idx: number) => (
                                        <a
                                          key={idx}
                                          href={file.fileUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                                        >
                                          <svg
                                            className="w-4 h-4 flex-shrink-0"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                            />
                                          </svg>
                                          <span className="truncate">
                                            {file.fileName}
                                          </span>
                                        </a>
                                      ),
                                    )}
                                  </div>
                                </div>
                              )}
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add Comment */}
                    <div className="border-t pt-4">
                      <label className="block text-sm font-medium mb-2">
                        Add Comment
                      </label>
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        rows={3}
                        className="w-full px-4 py-2 border rounded-lg mb-3"
                      />

                      {/* File Upload */}
                      <div className="mb-3">
                        <label className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                          <svg
                            className="w-5 h-5 text-gray-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                            />
                          </svg>
                          <span className="text-sm text-gray-600">
                            Attach files (images, PDFs, documents)
                          </span>
                          <input
                            type="file"
                            onChange={handleFileSelect}
                            className="hidden"
                            accept="image/*,.pdf,.doc,.docx"
                            multiple
                          />
                        </label>
                      </div>

                      {/* Selected Files Preview */}
                      {selectedFiles.length > 0 && (
                        <div className="mb-3 space-y-2">
                          <p className="text-sm font-medium text-gray-700">
                            Selected Files ({selectedFiles.length}):
                          </p>
                          {selectedFiles.map((file, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded"
                            >
                              <div className="flex items-center gap-2">
                                <svg
                                  className="w-4 h-4 text-gray-500"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                  />
                                </svg>
                                <span className="text-sm text-gray-700">
                                  {file.name}
                                </span>
                                <span className="text-xs text-gray-500">
                                  ({(file.size / 1024).toFixed(1)} KB)
                                </span>
                              </div>
                              <button
                                onClick={() =>
                                  setSelectedFiles(
                                    selectedFiles.filter((_, i) => i !== idx),
                                  )
                                }
                                className="text-red-600 hover:text-red-800"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <button
                        onClick={handleAddComment}
                        disabled={
                          (!newComment.trim() && selectedFiles.length === 0) ||
                          uploadingFiles
                        }
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        {uploadingFiles ? "Uploading..." : "Post Comment"}
                      </button>
                    </div>
                  </div>
                )}

                {/* ========== ACTIVITY LOGS TAB ========== */}
                {activeTab === "activity" && (
                  <div className="space-y-3">
                    {activityLogs.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p>No activity logs yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {activityLogs.map((log) => (
                          <div
                            key={log._id}
                            className="flex items-start gap-3 pb-3 border-b border-gray-200"
                          >
                            {/* Icon based on action */}
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                log.action === "created"
                                  ? "bg-green-100 text-green-600"
                                  : log.action === "status_changed"
                                    ? "bg-blue-100 text-blue-600"
                                    : log.action === "commented"
                                      ? "bg-purple-100 text-purple-600"
                                      : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {log.action === "created" && "✓"}
                              {log.action === "status_changed" && "↻"}
                              {log.action === "commented" && "💬"}
                              {log.action === "assigned" && "👤"}
                              {log.action === "unassigned" && "⊗"}
                              {![
                                "created",
                                "status_changed",
                                "commented",
                                "assigned",
                                "unassigned",
                              ].includes(log.action) && "•"}
                            </div>

                            <div className="flex-1">
                              <p className="text-sm text-gray-900">
                                {log.description}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(log.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer - Only show on Details tab */}
              {activeTab === "details" && (
                <div className="p-6 border-t border-gray-200">
                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsDetailModalOpen(false)}
                      className="flex-1 px-4 py-3 border rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateTask}
                      disabled={saving}
                      className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}