"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Filter } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import SessionGuard from "@/components/SessionGuard";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import FitoutLoadingSpinner from "@/components/FitoutLoadingSpinner";
import ProjectCard from "@/components/ProjectCard";
import CompletedAndCancelledProjects from "@/components/CompletedAndCancelledProjects";
import { CreateProjectModal } from "@/components/CreateProjectModal";
import EditProjectModal from "@/components/EditProjectModal";
import { apiClient } from "@/lib/axios";

interface Project {
  _id: string;
  projectName: string;
  brand: string;
  scope: string;
  workflow: string;
  status: string;
  budget: number;
  spent: number;
  description?: string;
  region?: string;
  projectCode?: string;
  startDate?: string;
  endDate?: string;
  calculatedStartDate?: string;
  calculatedEndDate?: string;
  isAtRisk?: boolean;
  riskReason?: string;
}

const ARCHIVED_STATUSES = ["Completed", "Cancelled"];

export default function ProjectsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  useEffect(() => {
    if (!authLoading && user && user.role !== "admin") {
      router.replace("/user/projects");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.role === "admin") {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
      const data = await apiClient.get<Project[]>("/api/projects");
      setProjects(data);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = useCallback((projectId: string, newStatus: string) => {
    setProjects((prev) =>
      prev.map((p) => (p._id === projectId ? { ...p, status: newStatus } : p)),
    );
  }, []);

  const handleProjectUpdated = useCallback((updatedProject: Project) => {
    setProjects((prev) =>
      prev.map((p) => (p._id === updatedProject._id ? updatedProject : p)),
    );
  }, []);

  const handleDelete = useCallback((projectId: string) => {
    setProjects((prev) => prev.filter((p) => p._id !== projectId));
  }, []);

  const handleEditOpen = useCallback((project: Project) => {
    setEditingProject(project);
  }, []);

  const handleProjectCreated = () => {
    fetchProjects();
    setIsCreateModalOpen(false);
  };

  const allFiltered = projects.filter((project) => {
    const matchesSearch =
      project.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.scope.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeProjects = allFiltered.filter((p) => !ARCHIVED_STATUSES.includes(p.status));
  const archivedProjects = projects.filter((p) => ARCHIVED_STATUSES.includes(p.status));

  if (authLoading || (loading && user?.role === "admin")) return <FitoutLoadingSpinner />;
  if (user && user.role !== "admin") return <FitoutLoadingSpinner />;

  return (
    <SessionGuard>
      <div className="min-h-screen bg-gray-50">
        <AdminSidebar userRole="admin" />
        <AdminHeader />

        <main className="lg:ml-[var(--fm-sidebar-width)] mt-16 p-4 sm:p-6 lg:p-8 transition-all duration-300">
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Projects</h1>
                <p className="text-sm text-gray-600">Manage all your fitout projects</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={20} />
                <span>New Project</span>
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Total Active</p>
                <p className="text-2xl font-bold text-gray-900">
                  {projects.filter((p) => !ARCHIVED_STATUSES.includes(p.status)).length}
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">
                  {projects.filter((p) => p.status === "In Progress").length}
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">At Risk</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {projects.filter((p) => p.isAtRisk || p.status === "At Risk").length}
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {projects.filter((p) => p.status === "Completed").length}
                </p>
              </div>
            </div>

            {/* Search + Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter size={20} className="text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="all">All Active</option>
                  <option value="Planning">Planning</option>
                  <option value="In Progress">In Progress</option>
                  <option value="At Risk">At Risk</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active Projects Grid */}
          {activeProjects.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No active projects found</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Get started by creating your first project"}
              </p>
              {!searchQuery && statusFilter === "all" && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Project
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {activeProjects.map((project) => (
                <ProjectCard
                  key={project._id}
                  project={project}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDelete}
                  onEdit={handleEditOpen}
                />
              ))}
            </div>
          )}

          {/* Archived section */}
          <CompletedAndCancelledProjects
            projects={archivedProjects}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
            onEdit={handleEditOpen}
          />
        </main>

        <CreateProjectModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleProjectCreated}
        />

        <EditProjectModal
          project={editingProject}
          isOpen={!!editingProject}
          onClose={() => setEditingProject(null)}
          onSuccess={handleProjectUpdated}
        />
      </div>
    </SessionGuard>
  );
}