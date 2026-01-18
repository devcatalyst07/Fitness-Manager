import React from "react";
import { LucideIcon } from "lucide-react";

// ========================================
// STATS CARD COMPONENT
// ========================================
interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtitle?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  subtitle,
}: StatsCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-600">{title}</p>
        <Icon size={20} className="text-gray-400" />
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}

// ========================================
// INSIGHT CARD COMPONENT
// ========================================
interface InsightCardProps {
  type: "action" | "info" | "warning";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  onAction?: () => void;
}

export function InsightCard({
  type,
  priority,
  title,
  description,
  onAction,
}: InsightCardProps) {
  const getPriorityColor = () => {
    switch (priority) {
      case "high":
        return "border-orange-200 bg-orange-50 text-orange-600";
      case "medium":
        return "border-yellow-200 bg-yellow-50 text-yellow-600";
      case "low":
        return "border-blue-200 bg-blue-50 text-blue-600";
      default:
        return "border-gray-200 bg-gray-50 text-gray-600";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "action":
        return "⚡";
      case "warning":
        return "⚠️";
      case "info":
        return "ℹ️";
      default:
        return "📌";
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getPriorityColor()}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getIcon()}</span>
          <div>
            <p className="font-semibold text-gray-900">{title}</p>
            <p className="text-sm text-gray-700 mt-1">{description}</p>
          </div>
        </div>
        {onAction && (
          <button
            onClick={onAction}
            className="text-sm font-medium px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap ml-4"
          >
            Review task
          </button>
        )}
      </div>
    </div>
  );
}

// ========================================
// DEADLINE CARD COMPONENT
// ========================================
interface DeadlineCardProps {
  title: string;
  dueDate: string;
  priority: string;
  status?: string;
  onClick?: () => void;
}

export function DeadlineCard({
  title,
  dueDate,
  priority,
  status,
  onClick,
}: DeadlineCardProps) {
  const getPriorityColor = () => {
    switch (priority) {
      case "Critical":
        return "bg-red-100 text-red-700 border-red-200";
      case "High":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "Medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "Low":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getDaysUntilDue = () => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Due today";
    if (diffDays === 1) return "Due tomorrow";
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    return `Due in ${diffDays} days`;
  };

  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors border border-gray-200"
    >
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">{title}</p>
        <p className="text-sm text-gray-600 mt-1">
          {new Date(dueDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}{" "}
          • {getDaysUntilDue()}
        </p>
      </div>
      <div className="flex items-center gap-2 ml-3">
        {status && (
          <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
            {status}
          </span>
        )}
        <span
          className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor()}`}
        >
          {priority}
        </span>
      </div>
    </div>
  );
}
