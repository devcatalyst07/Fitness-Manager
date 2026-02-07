"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Filter } from "lucide-react";

// Components
import UserSidebar from "@/components/AdminSidebar";
import UserHeader from "@/components/AdminHeader";
import FitoutLoadingSpinner from "@/components/FitoutLoadingSpinner";
import ProjectCard from "@/components/ProjectCard";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://fitout-manager-api.vercel.app";

interface Project {
  _id: string;
  projectName: string;
  brand: string;
  scope: string;
  workflow: string;
  status: string;
  budget: number;
  spent: number;
  startDate?: string;
  endDate?: string;
  calculatedStartDate?: string;
  calculatedEndDate?: string;
  isAtRisk?: boolean;
  riskReason?: string;
}

export default function UserProjectsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userRole = localStorage.getItem("userRole");

    if (!token || userRole !== "user") {
      router.push("/");
      return;
    }

    setIsVerified(true);
    fetchProjects();
  }, [router]);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/projects`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      } else {
        console.error("Failed to fetch projects");
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.scope.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || project.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (!isVerified || loading) {
    return <FitoutLoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <UserSidebar />
      <UserHeader />

      <main className="lg:ml-64 mt-16 p-4 sm:p-6 lg:p-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                My Projects
              </h1>
              <p className="text-sm text-gray-600">
                View and manage your assigned projects
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Total Projects</p>
              <p className="text-2xl font-bold text-gray-900">
                {projects.length}
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
                {projects.filter((p) => p.isAtRisk).length}
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {projects.filter((p) => p.status === "Completed").length}
              </p>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
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
                <option value="all">All Status</option>
                <option value="Planning">Planning</option>
                <option value="In Progress">In Progress</option>
                <option value="On Hold">On Hold</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No projects found
            </h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your search or filters"
                : "You are not assigned to any projects yet"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard key={project._id} project={project} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}