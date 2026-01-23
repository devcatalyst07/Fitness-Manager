import React, { useState, useEffect } from "react";
import { BrandProject } from "@/types/brand.types";
import { Calendar } from "lucide-react";

interface BrandProjectsListProps {
  projects: BrandProject[];
  brandName: string;
}

export default function BrandProjectsList({
  projects,
  brandName,
}: BrandProjectsListProps) {
  const [taskStats, setTaskStats] = useState<
    Record<string, { total: number; completed: number }>
  >({});
  const [loading, setLoading] = useState(true);

  // Fetch task stats from backend
  useEffect(() => {
    const fetchTaskStats = async () => {
      try {
        setLoading(true);
        const stats: Record<string, { total: number; completed: number }> = {};

        for (const project of projects) {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/tasks/${project._id}/tasks/stats/overview`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            },
          );

          if (response.ok) {
            const data = await response.json();
            stats[project._id] = {
              total: data.totalTasks,
              completed: data.completedTasks,
            };
          } else {
            // Fallback to empty if error
            stats[project._id] = { total: 0, completed: 0 };
          }
        }

        setTaskStats(stats);
      } catch (error) {
        console.error("Error fetching task stats:", error);
        // Set empty stats for all projects on error
        const emptyStats: Record<string, { total: number; completed: number }> =
          {};
        projects.forEach((p) => {
          emptyStats[p._id] = { total: 0, completed: 0 };
        });
        setTaskStats(emptyStats);
      } finally {
        setLoading(false);
      }
    };

    if (projects.length > 0) {
      fetchTaskStats();
    }
  }, [projects]);
  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Progress":
        return "bg-blue-100 text-blue-800";
      case "Planning":
        return "bg-yellow-100 text-yellow-800";
      case "Completed":
        return "bg-green-100 text-green-800";
      case "On Hold":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
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
          <p className="text-sm">
            Create a project for {brandName} to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Projects & Tasks
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((project) => {
          const tasks = taskStats[project._id] || { total: 0, completed: 0 };
          const progress = calculateProgress(project);

          return (
            <div
              key={project._id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              {/* Project Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-blue-600" />
                  <h4 className="font-semibold text-gray-900">
                    {project.projectName}
                  </h4>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}
                >
                  {project.status}
                </span>
              </div>

              {/* Tasks Count */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  <span>Tasks</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {tasks.completed}/{tasks.total}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-green-500 h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${(tasks.completed / tasks.total) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Budget */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <span>$</span>
                  <span>Budget</span>
                </div>
                <span className="font-medium text-gray-900">
                  ${project.budget.toLocaleString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
