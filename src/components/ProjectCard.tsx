"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  DollarSign,
  AlertTriangle,
  Trash2,
  Pencil,
  ChevronDown,
  CheckCircle2,
  Clock,
  CircleDot,
  Loader2,
  TriangleAlert,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
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
  startDate?: string;
  endDate?: string;
  calculatedStartDate?: string;
  calculatedEndDate?: string;
  isAtRisk?: boolean;
  riskReason?: string;
  description?: string;
}

interface ProjectCardProps {
  project: Project;
  onStatusChange?: (projectId: string, newStatus: string) => void;
  onDelete?: (projectId: string) => void;
  onEdit?: (project: Project) => void;
}

const STATUS_OPTIONS = [
  {
    value: "Planning",
    label: "Planning",
    icon: CircleDot,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  {
    value: "In Progress",
    label: "In Progress",
    icon: Loader2,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  {
    value: "At Risk",
    label: "At Risk",
    icon: TriangleAlert,
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-200",
    dot: "bg-orange-500",
  },
  {
    value: "Completed",
    label: "Completed",
    icon: CheckCircle2,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  {
    value: "On Hold",
    label: "On Hold",
    icon: Clock,
    color: "text-slate-600",
    bg: "bg-slate-50",
    border: "border-slate-200",
    dot: "bg-slate-400",
  },
  {
    value: "Cancelled",
    label: "Cancelled",
    icon: CircleDot,
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    dot: "bg-red-400",
  },
];

function getStatusConfig(status: string) {
  return (
    STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0]
  );
}

export default function ProjectCard({
  project,
  onStatusChange,
  onDelete,
  onEdit,
}: ProjectCardProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const basePath = isAdmin ? "/admin" : "/user";

  const [currentStatus, setCurrentStatus] = useState(project.status);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const deleteRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
      if (
        deleteRef.current &&
        !deleteRef.current.contains(e.target as Node)
      ) {
        setShowDeleteConfirm(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleStatusChange = async (
    e: React.MouseEvent,
    newStatus: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (newStatus === currentStatus) {
      setIsDropdownOpen(false);
      return;
    }

    setIsUpdating(true);
    setUpdateError(null);
    setIsDropdownOpen(false);

    try {
      await apiClient.put(`/api/projects/${project._id}`, {
        status: newStatus,
      });
      setCurrentStatus(newStatus);
      onStatusChange?.(project._id, newStatus);
    } catch (err: any) {
      setUpdateError(err?.message || "Failed to update status");
      setTimeout(() => setUpdateError(null), 3000);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAdmin) return;

    setIsDeleting(true);
    try {
      await apiClient.delete(`/api/projects/${project._id}`);
      onDelete?.(project._id);
    } catch (err: any) {
      setUpdateError(err?.message || "Failed to delete project");
      setTimeout(() => setUpdateError(null), 3000);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const budgetPercentage =
    project.budget > 0
      ? Math.min((project.spent / project.budget) * 100, 100)
      : 0;

  const statusConfig = getStatusConfig(currentStatus);
  const StatusIcon = statusConfig.icon;

  const startDisplay = project.calculatedStartDate || project.startDate;
  const endDisplay = project.calculatedEndDate || project.endDate;

  return (
    <div className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-visible flex flex-col">
      {/* Top accent bar */}
      <div
        className={`h-1 w-full rounded-t-2xl ${statusConfig.dot}`}
        style={{ opacity: 0.7 }}
      />

      {/* Card Body */}
      <Link
        href={`${basePath}/projects/${project._id}`}
        className="flex-1 block p-5 pb-0"
      >
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors leading-snug line-clamp-2 mb-1">
              {project.projectName}
            </h3>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-xs font-medium text-gray-600">
                {project.brand}
              </span>
              <span className="text-gray-300">·</span>
              <span className="text-xs text-gray-500 truncate">
                {project.scope}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        {project.description && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3 -mt-1">
            {project.description}
          </p>
        )}

        {/* Risk Banner */}
        {project.isAtRisk && (
          <div className="mb-3 flex items-start gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle
              size={13}
              className="text-amber-500 flex-shrink-0 mt-0.5"
            />
            <div>
              <p className="text-xs font-semibold text-amber-800">At Risk</p>
              {project.riskReason && (
                <p className="text-xs text-amber-700 mt-0.5 line-clamp-2">
                  {project.riskReason}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Dates */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
          <Calendar size={13} className="text-gray-400 flex-shrink-0" />
          <span>
            {startDisplay
              ? new Date(startDisplay).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "No start"}
          </span>
          <span className="text-gray-300">→</span>
          <span>
            {endDisplay
              ? new Date(endDisplay).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "No end"}
          </span>
        </div>

        {/* Budget */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <DollarSign size={13} className="text-gray-400" />
              <span>Budget</span>
            </div>
            <span className="text-xs font-semibold text-gray-700">
              ${project.spent.toLocaleString()}{" "}
              <span className="font-normal text-gray-400">/</span>{" "}
              ${project.budget.toLocaleString()}
            </span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                budgetPercentage > 90
                  ? "bg-red-500"
                  : budgetPercentage > 75
                    ? "bg-amber-400"
                    : "bg-emerald-500"
              }`}
              style={{ width: `${budgetPercentage}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-gray-400">
              {budgetPercentage.toFixed(0)}% used
            </span>
            <span className="text-[10px] text-gray-400">
              ${(project.budget - project.spent).toLocaleString()} remaining
            </span>
          </div>
        </div>
      </Link>

      {/* Footer row — outside Link to avoid nested <a> issues */}
      <div className="px-5 pb-4 pt-3 border-t border-gray-50 flex items-center justify-between gap-2">
        {/* Workflow tag */}
        <span className="text-[11px] text-gray-400 truncate max-w-[120px]">
          {project.workflow}
        </span>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Status Dropdown — admin only edit, others see badge */}
          {isAdmin ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDropdownOpen((v) => !v);
                }}
                disabled={isUpdating}
                className={`
                  inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border
                  transition-all duration-150 cursor-pointer select-none
                  ${statusConfig.bg} ${statusConfig.border} ${statusConfig.color}
                  hover:brightness-95 active:scale-95 disabled:opacity-60
                `}
                title="Change status"
              >
                {isUpdating ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}
                  />
                )}
                <span>{currentStatus}</span>
                <ChevronDown
                  size={11}
                  className={`transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isDropdownOpen && (
                <div className="absolute bottom-full right-0 mb-1 w-40 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden py-1">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={(e) => handleStatusChange(e, opt.value)}
                      className={`
                        w-full flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors
                        ${currentStatus === opt.value ? `${opt.bg} ${opt.color}` : "text-gray-700 hover:bg-gray-50"}
                      `}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${opt.dot}`}
                      />
                      {opt.label}
                      {currentStatus === opt.value && (
                        <CheckCircle2
                          size={11}
                          className={`ml-auto ${opt.color}`}
                        />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Non-admin: read-only badge */
            <span
              className={`
                inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border
                ${statusConfig.bg} ${statusConfig.border} ${statusConfig.color}
              `}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}
              />
              {currentStatus}
            </span>
          )}

          {/* Edit Button — admin only */}
          {isAdmin && onEdit && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit(project);
              }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-150 active:scale-95"
              title="Edit project"
            >
              <Pencil size={14} />
            </button>
          )}

          {/* Delete Button — admin only */}
          {isAdmin && (
            <div className="relative" ref={deleteRef}>
              {showDeleteConfirm ? (
                <div className="absolute bottom-full right-0 mb-1 flex items-center gap-1.5 bg-white border border-red-200 rounded-xl shadow-lg px-3 py-2 z-50">
                  <span className="text-xs text-gray-600 whitespace-nowrap">
                    Delete?
                  </span>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded-md transition-colors disabled:opacity-60"
                  >
                    {isDeleting ? "..." : "Yes"}
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowDeleteConfirm(false);
                    }}
                    className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs rounded-md transition-colors"
                  >
                    No
                  </button>
                </div>
              ) : null}

              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowDeleteConfirm(true);
                }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-150 active:scale-95"
                title="Delete project"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Inline error toast */}
      {updateError && (
        <div className="absolute bottom-0 left-0 right-0 bg-red-600 text-white text-xs px-4 py-2 rounded-b-2xl text-center animate-fade-in z-50">
          {updateError}
        </div>
      )}
    </div>
  );
}