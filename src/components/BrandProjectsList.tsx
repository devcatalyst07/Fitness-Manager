import React, { useState, useEffect } from "react";
import { BrandProject } from "@/types/brand.types";
import { Calendar } from "lucide-react";
import { apiClient } from "@/lib/axios";

interface BrandProjectsListProps {
  projects: BrandProject[];
  brandName: string;
}

export default function BrandProjectsList({ projects, brandName }: BrandProjectsListProps) {
  const [taskStats, setTaskStats] = useState<Record<string, { total: number; completed: number }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTaskStats = async () => {
      try {
        setLoading(true);
        const stats: Record<string, { total: number; completed: number }> = {};

        for (const project of projects) {
          try {
            const data = await apiClient.get(`/api/tasks/${project._id}/tasks/stats/overview`);
            stats[project._id] = { total: data.totalTasks, completed: data.completedTasks };
          } catch {
            stats[project._id] = { total: 0, completed: 0 };
          }
        }

        setTaskStats(stats);
      } catch (error) {
        console.error("Error fetching task stats:", error);
        const emptyStats: Record<string, { total: number; completed: number }> = {};
        projects.forEach((p) => { emptyStats[p._id] = { total: 0, completed: 0 }; });
        setTaskStats(emptyStats);
      } finally {
        setLoading(false);
      }
    };

    if (projects.length > 0) fetchTaskStats();
  }, [projects]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Progress": return "bg-blue-100 text-blue-800";
      case "Planning": return "bg-yellow-100 text-yellow-800";
      case "Completed": return "bg-green-100 text-green-800";
      case "On Hold": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const calculateProgress = (project: BrandProject) => {
    if (project.budget === 0) return 0;
    return Math.round((project.spent / project.budget) * 100);
  };

  if (projects.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="text-center text-gray-500">
          <p className="font-medium mb-2">No projects yet</p>
          <p className="text-sm">Create a project for {brandName} to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Projects & Tasks</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((project) => {
          const tasks = taskStats[project._id] || { total: 0, completed: 0 };
          const progress = calculateProgress(project);
          return (
            <div key={project._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-blue-600" />
                  <h4 className="font-semibold text-gray-900">{project.projectName}</h4>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>{project.status}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Tasks</span>
                <span className="text-sm font-medium text-gray-900">{tasks.completed}/{tasks.total}</span>
              </div>
              <div className="mb-3">
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div className="bg-green-500 h-full rounded-full transition-all duration-300" style={{ width: `${tasks.total > 0 ? (tasks.completed / tasks.total) * 100 : 0}%` }} />
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Budget</span>
                <span className="font-medium text-gray-900">${project.budget.toLocaleString()}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}