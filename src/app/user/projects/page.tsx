"use client";
// USER/PROJECTS/PAGE.TSX
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Filter, FolderKanban } from "lucide-react";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import { StatsCard } from "@/components/StatsCard";
import { ProjectCard } from "@/components/ProjectCard";
import { CreateProjectModal } from "@/components/CreateProjectModal";
import FitoutLoadingSpinner from "@/components/FitoutLoadingSpinner";
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

interface Project {
  _id: string;
  projectName: string;
  brand: string;
  scope: string;
  workflow: string;
  projectCode?: string;
  description?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  budget: number;
  spent: number;
  status: "Planning" | "In Progress" | "Completed" | "On Hold";
  userId: {
    name: string;
    email: string;
  };
  createdBy: "user" | "admin";
  createdAt: string;
}

interface ProjectStats {
  total: number;
  active: number;
  completed: number;
  planning: number;
}

export default function UserProjects() {
  const router = useRouter();
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [roleData, setRoleData] = useState<RoleData | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<ProjectStats>({
    total: 0,
    active: 0,
    completed: 0,
    planning: 0,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");
    const roleId = localStorage.getItem("roleId");

    if (!token || role !== "user") {
      localStorage.clear();
      router.replace("/");
    } else if (!roleId) {
      alert("No role assigned. Please contact administrator.");
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

        // Check Projects permission
        if (!hasPermission("projects", data.permissions)) {
          alert("You do not have permission to access Projects.");
          router.replace("/user/dashboard");
          return;
        }

        fetchProjects();
        fetchStats();
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

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/projects/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleProjectCreated = () => {
    fetchProjects();
    fetchStats();
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
  const canCreateProject = hasPermission("projects-new", permissions);
  const canDeleteProject = hasPermission("projects-delete", permissions);
  const canViewDetails = hasPermission("projects-view-details", permissions);

  const filteredProjects = projects.filter(
    (project) =>
      project.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.brand.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar userRole="user" permissions={permissions} />
      <AdminHeader />

      <main className="lg:ml-64 mt-16 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Projects
            </h1>
            <p className="text-sm text-gray-600 mt-1">Role: {roleData.name}</p>
          </div>
          {canCreateProject && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Plus size={20} />
              <span>New Project</span>
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter size={20} />
            <span>Filters</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard title="Total Projects" value={stats.total} color="blue" />
          <StatsCard title="Active" value={stats.active} color="green" />
          <StatsCard title="Completed" value={stats.completed} color="purple" />
          <StatsCard title="Planning" value={stats.planning} color="orange" />
        </div>

        {filteredProjects.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <FolderKanban size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {projects.length === 0 ? "No projects yet" : "No projects found"}
            </h3>
            <p className="text-gray-600 mb-4">
              {projects.length === 0
                ? canCreateProject
                  ? "Get started by creating your first project"
                  : "No projects assigned to you yet"
                : "Try adjusting your search query"}
            </p>
            {canCreateProject && projects.length === 0 && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800"
              >
                <Plus size={20} />
                <span>Create Project</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project._id}
                project={project}
                onUpdate={fetchProjects}
                canViewDetails={canViewDetails}
                canDelete={canDeleteProject}
                userRole="user"
              />
            ))}
          </div>
        )}
      </main>

      {canCreateProject && (
        <CreateProjectModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleProjectCreated}
        />
      )}
    </div>
  );
}
