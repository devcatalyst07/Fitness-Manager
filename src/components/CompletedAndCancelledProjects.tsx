"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Archive,
} from "lucide-react";
import ProjectCard from "@/components/ProjectCard";

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
  startDate?: string;
  endDate?: string;
  calculatedStartDate?: string;
  calculatedEndDate?: string;
  isAtRisk?: boolean;
  riskReason?: string;
}

interface CompletedAndCancelledProjectsProps {
  projects: Project[];
  onStatusChange?: (projectId: string, newStatus: string) => void;
  onDelete?: (projectId: string) => void;
  onEdit?: (project: Project) => void;
}

export default function CompletedAndCancelledProjects({
  projects,
  onStatusChange,
  onDelete,
  onEdit,
}: CompletedAndCancelledProjectsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const completed = projects.filter((p) => p.status === "Completed");
  const cancelled = projects.filter((p) => p.status === "Cancelled");
  const total = projects.length;

  if (total === 0) return null;

  return (
    <section className="mt-10">
      {/* Section divider */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1 h-px bg-gray-200" />
        <div className="flex items-center gap-2 text-xs text-gray-400 font-medium uppercase tracking-wider">
          <Archive size={13} />
          <span>Archived Projects</span>
        </div>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Toggle header */}
      <button
        onClick={() => setIsExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors group"
      >
        <div className="flex items-center gap-4">
          {/* Completed badge */}
          {completed.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-lg">
              <CheckCircle2 size={13} className="text-emerald-600" />
              <span className="text-xs font-medium text-emerald-700">
                {completed.length} Completed
              </span>
            </div>
          )}
          {/* Cancelled badge */}
          {cancelled.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-red-50 border border-red-200 rounded-lg">
              <XCircle size={13} className="text-red-500" />
              <span className="text-xs font-medium text-red-600">
                {cancelled.length} Cancelled
              </span>
            </div>
          )}
          <span className="text-xs text-gray-400">
            {total} project{total !== 1 ? "s" : ""} archived
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-gray-500 group-hover:text-gray-700 transition-colors">
          <span>{isExpanded ? "Hide" : "Show"}</span>
          {isExpanded ? (
            <ChevronUp size={14} />
          ) : (
            <ChevronDown size={14} />
          )}
        </div>
      </button>

      {/* Expandable grid */}
      {isExpanded && (
        <div className="mt-4 space-y-6">
          {/* Completed sub-section */}
          {completed.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 size={14} className="text-emerald-600" />
                <h3 className="text-sm font-semibold text-gray-700">
                  Completed
                </h3>
                <span className="text-xs text-gray-400">
                  ({completed.length})
                </span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                {completed.map((project) => (
                  <div key={project._id} className="opacity-80 hover:opacity-100 transition-opacity">
                    <ProjectCard
                      project={project}
                      onStatusChange={onStatusChange}
                      onDelete={onDelete}
                      onEdit={onEdit}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cancelled sub-section */}
          {cancelled.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <XCircle size={14} className="text-red-500" />
                <h3 className="text-sm font-semibold text-gray-700">
                  Cancelled
                </h3>
                <span className="text-xs text-gray-400">
                  ({cancelled.length})
                </span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                {cancelled.map((project) => (
                  <div key={project._id} className="opacity-70 hover:opacity-100 transition-opacity grayscale hover:grayscale-0">
                    <ProjectCard
                      project={project}
                      onStatusChange={onStatusChange}
                      onDelete={onDelete}
                      onEdit={onEdit}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}