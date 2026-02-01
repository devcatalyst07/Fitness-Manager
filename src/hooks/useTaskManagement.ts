import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Task, Comment, ActivityLog, TeamMember, Phase } from "@/types/task.types";
import {
  taskService,
  commentService,
  activityService,
  teamService,
  projectService,
  fileService,
} from "@/services/taskService";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://fitout-manager-api.vercel.app";

export function useTaskManagement(projectId: string) {
  const router = useRouter();

  // Authentication & Loading
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  // Project & Tasks
  const [projectName, setProjectName] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);

  // ============================================
  // PHASE MANAGEMENT - NEW
  // ============================================
  const [phases, setPhases] = useState<Phase[]>([]);
  const [isPhaseModalOpen, setIsPhaseModalOpen] = useState(false);
  const [editingPhase, setEditingPhase] = useState<Phase | null>(null);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeTab, setActiveTab] = useState<
    "details" | "comments" | "activity"
  >("details");

  // Form Data - UPDATED to include phaseId
// Form Data - UPDATED to include phaseId
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    status: string;
    priority: string;
    assignees: { email: string; name: string }[];
    startDate: string;
    dueDate: string;
    progress: number;
    phaseId: string | null;
  }>({
    title: "",
    description: "",
    status: "",
    priority: "",
    assignees: [],
    startDate: "",
    dueDate: "",
    progress: 0,
    phaseId: null,
  });
  const [saving, setSaving] = useState(false);

  // Team & Assignees
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<
    { email: string; name: string }[]
  >([]);

  // Comments & Activity
  const [comments, setComments] = useState<Comment[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [newComment, setNewComment] = useState("");

  // File Upload
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Dropdown
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // ============================================
  // AUTHENTICATION CHECK
  // ============================================
  useEffect(() => {
    // Auto-detect role from localStorage (don't use requiredRole param)
    const token = localStorage.getItem("token");
    const userRole = localStorage.getItem("userRole");

    if (!token || !userRole) {
      // No token or role, don't redirect here - let the page handle it
      console.warn("No authentication found in useTaskManagement");
      setIsVerified(false);
      setLoading(false);
      return;
    }

    // Valid authentication found
    setIsVerified(true);
    fetchProject();
    fetchTasks();
    fetchTeamMembers();
    fetchPhases(); // NEW - Fetch phases on mount
  }, [projectId, router]);

  // ============================================
  // CLICK OUTSIDE HANDLER
  // ============================================
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

  // ============================================
  // FETCH OPERATIONS
  // ============================================

  const fetchProject = async () => {
    try {
      const data = await projectService.getProject(projectId);
      setProjectName(data.projectName);
    } catch (error) {
      console.error("Error fetching project:", error);
    }
  };

  const fetchTasks = async () => {
    try {
      const data = await taskService.getTasks(projectId);
      
      // ✅ FIX: Extract allTasks array from the response with proper typing
      // The API returns: { phases: [...], unassignedTasks: [...], allTasks: [...] }
      // We need just the allTasks array
      if (data && typeof data === 'object' && 'allTasks' in data) {
        const allTasks = (data as { allTasks?: Task[] }).allTasks;
        setTasks(Array.isArray(allTasks) ? allTasks : []);
      } else if (Array.isArray(data)) {
        // Fallback: if the API returns an array directly
        setTasks(data as Task[]);
      } else {
        console.warn('Unexpected tasks data structure:', data);
        setTasks([]);
      }
    } catch (error) {
      // Handle 403 from backend (e.g., "Admins only") with a user-friendly message
      const err: any = error;
      if (err?.status === 403) {
        console.warn("Access denied when fetching tasks:", err.message || err);
        alert(
          "You don't have access to view tasks for this project. Contact your administrator.",
        );
        setTasks([]);
      } else {
        console.error("Error fetching tasks:", error);
        setTasks([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const data = await teamService.getTeamMembers(projectId);
      setTeamMembers(data);
    } catch (error) {
      const err: any = error;
      if (err?.status === 403) {
        console.warn(
          "Access denied when fetching team members:",
          err.message || err,
        );
        // don't spam console; show a single alert
        alert(
          "You don't have access to view team members for this project. Contact your administrator.",
        );
        setTeamMembers([]);
      } else {
        console.error("Error fetching team members:", error);
      }
    }
  };

  const fetchComments = async (taskId: string) => {
    try {
      const data = await commentService.getComments(taskId);
      setComments(data);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const fetchActivityLogs = async (taskId: string) => {
    try {
      const data = await activityService.getActivityLogs(taskId);
      setActivityLogs(data);
    } catch (error) {
      console.error("Error fetching activity logs:", error);
    }
  };

  // ============================================
  // PHASE OPERATIONS - NEW
  // ============================================

  const fetchPhases = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_URL}/api/projects/${projectId}/phases`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPhases(data);
      } else {
        console.error('Fetch phases failed:', response.status);
      }
    } catch (error) {
      console.error('Fetch phases error:', error);
    }
  };

  const createPhase = async (phaseData: { 
    name: string; 
    description?: string; 
    color?: string 
  }): Promise<boolean> => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_URL}/api/projects/${projectId}/phases`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(phaseData),
        }
      );

      if (response.ok) {
        await fetchPhases();
        setIsPhaseModalOpen(false);
        return true;
      }
      
      const error = await response.json();
      alert(error.message || 'Failed to create phase');
      return false;
    } catch (error) {
      console.error('Create phase error:', error);
      alert('Failed to create phase');
      return false;
    }
  };

  const updatePhase = async (
    phaseId: string, 
    phaseData: Partial<Phase>
  ): Promise<boolean> => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_URL}/api/projects/${projectId}/phases/${phaseId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(phaseData),
        }
      );

      if (response.ok) {
        await fetchPhases();
        setEditingPhase(null);
        return true;
      }

      const error = await response.json();
      alert(error.message || 'Failed to update phase');
      return false;
    } catch (error) {
      console.error('Update phase error:', error);
      alert('Failed to update phase');
      return false;
    }
  };

  const deletePhase = async (phaseId: string): Promise<boolean> => {
    if (!confirm('Delete this phase? Tasks will be moved to "Unassigned".')) {
      return false;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_URL}/api/projects/${projectId}/phases/${phaseId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        await fetchPhases();
        await fetchTasks(); // Refresh tasks since they've been updated
        return true;
      }

      const error = await response.json();
      alert(error.message || 'Failed to delete phase');
      return false;
    } catch (error) {
      console.error('Delete phase error:', error);
      alert('Failed to delete phase');
      return false;
    }
  };

  // ============================================
  // TASK OPERATIONS
  // ============================================

  const createTask = async () => {
    if (!formData.title || formData.assignees.length === 0) {
      alert("Please fill in required fields");
      return;
    }

    setSaving(true);

    try {
      const result = await taskService.createTask(projectId, {
        title: formData.title,
        description: formData.description,
        status: (formData.status as any) || "Backlog",
        priority: (formData.priority as any) || "Medium",
        assignees: formData.assignees,
        startDate: formData.startDate,
        dueDate: formData.dueDate,
        progress: formData.progress,
        phaseId: formData.phaseId, // NEW - Include phaseId
      });

      alert("Task created successfully!");
      setIsCreateModalOpen(false);
      resetForm();
      fetchTasks();
    } catch (error: any) {
      console.error("Create task error:", error);
      alert(error.message || "Failed to create task");
    } finally {
      setSaving(false);
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      console.log('Update attempt:', { projectId, taskId, updates });
      await taskService.updateTask(projectId, taskId, updates);
      alert("Task updated successfully!");
      fetchTasks();
      if (selectedTask?._id === taskId) {
        setIsDetailModalOpen(false);
        setSelectedTask(null);
      }
    } catch (error: any) {
      console.error("Update task error:", error);
      console.error("Error status:", error.status);
      console.error("Error body:", error.body);
      alert(error.message || "Failed to update task");
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await taskService.deleteTask(taskId);
      alert("Task deleted successfully!");
      fetchTasks();
    } catch (error: any) {
      console.error("Delete task error:", error);
      alert(error.message || "Failed to delete task");
    }
  };

  const changeTaskStatus = async (taskId: string, newStatus: any) => {
    try {
      await taskService.updateTask(projectId, taskId, { status: newStatus });
      fetchTasks();
    } catch (error: any) {
      console.error("Change status error:", error);
      alert(error.message || "Failed to change status");
    }
  };

  // ============================================
  // COMMENT OPERATIONS
  // ============================================

  const addComment = async () => {
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
        setNewComment("");
        setSelectedFiles([]);
        fetchComments(selectedTask._id);
        fetchActivityLogs(selectedTask._id);
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to add comment");
      }
    } catch (error: any) {
      console.error("Add comment error:", error);
      alert(error.message || "Failed to add comment");
    } finally {
      setUploadingFiles(false);
    }
  };

  // ============================================
  // FILE OPERATIONS
  // ============================================

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
        const response = await fetch(
          `${API_URL}/api/upload`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          },
        );

        if (response.ok) {
          const data = await response.json();
          // Push the entire file object from backend (exactly like old code)
          uploadedFiles.push(data.file);
        } else {
          console.error("Failed to upload:", file.name);
        }
      } catch (error) {
        console.error("Upload error:", error);
      }
    }

    setUploadingFiles(false);
    return uploadedFiles;
  };

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  const checkMemberHasActiveTask = (memberEmail: string): boolean => {
    return tasks.some(
      (task) =>
        task.assignees?.some((a) => a.email === memberEmail) &&
        task.status !== "Done",
    );
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      status: "",
      priority: "",
      assignees: [],
      startDate: "",
      dueDate: "",
      progress: 0,
      phaseId: null, // NEW - Reset phaseId
    });
    setSelectedAssignees([]);
    setSelectedFiles([]);
  };

  const openTaskDetails = (task: Task) => {
    setSelectedTask(task);
    setActiveTab("details");
    setIsDetailModalOpen(true);
    fetchComments(task._id);
    fetchActivityLogs(task._id);
  };

  // ============================================
  // RETURN ALL STATES & FUNCTIONS
  // ============================================

  return {
    // Authentication & Loading
    loading,
    isVerified,

    // Project & Tasks
    projectName,
    tasks,
    fetchTasks,

    // Modal States
    isCreateModalOpen,
    setIsCreateModalOpen,
    isDetailModalOpen,
    setIsDetailModalOpen,
    selectedTask,
    setSelectedTask,
    activeTab,
    setActiveTab,

    // Form Data
    formData,
    setFormData,
    saving,
    resetForm,

    // Team & Assignees
    teamMembers,
    selectedAssignees,
    setSelectedAssignees,
    checkMemberHasActiveTask,

    // Comments & Activity
    comments,
    activityLogs,
    newComment,
    setNewComment,
    addComment,
    fetchComments,
    fetchActivityLogs,

    // File Upload
    selectedFiles,
    setSelectedFiles,
    uploadingFiles,
    handleFileSelect,
    uploadFiles,

    // Dropdown
    openDropdown,
    setOpenDropdown,

    // Task Operations
    createTask,
    updateTask,
    deleteTask,
    changeTaskStatus,
    openTaskDetails,

    // ============================================
    // PHASE MANAGEMENT - NEW RETURNS
    // ============================================
    phases,
    isPhaseModalOpen,
    setIsPhaseModalOpen,
    editingPhase,
    setEditingPhase,
    createPhase,
    updatePhase,
    deletePhase,
    fetchPhases,
  };
}