import React from "react";
import { Calendar } from "lucide-react";

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

// ========================================
// DEADLINE FILTER DROPDOWN
// ========================================
interface DeadlineFilterProps {
  currentDays: number;
  onFilterChange: (days: number) => void;
}

export function DeadlineFilter({
  currentDays,
  onFilterChange,
}: DeadlineFilterProps) {
  const options = [
    { value: 3, label: "Next 3 days" },
    { value: 7, label: "Next 7 days" },
    { value: 10, label: "Next 10 days" },
    { value: 14, label: "Next 2 weeks" },
    { value: 30, label: "Next month" },
  ];

  return (
    <select
      value={currentDays}
      onChange={(e) => onFilterChange(parseInt(e.target.value))}
      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

// ========================================
// DEADLINES CONTAINER
// ========================================
interface DeadlinesContainerProps {
  deadlines: any[];
  currentDays: number;
  onFilterChange: (days: number) => void;
  onTaskClick: () => void;
}

export function DeadlinesContainer({
  deadlines,
  currentDays,
  onFilterChange,
  onTaskClick,
}: DeadlinesContainerProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          📅 Upcoming Deadlines
        </h3>
        <DeadlineFilter
          currentDays={currentDays}
          onFilterChange={onFilterChange}
        />
      </div>

      {deadlines.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Calendar size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium">No upcoming deadlines</p>
          <p className="text-sm">All tasks are on track or completed</p>
        </div>
      ) : (
        <div className="space-y-2">
          {deadlines.map((task) => (
            <DeadlineCard
              key={task._id}
              title={task.title}
              dueDate={task.dueDate}
              priority={task.priority}
              status={task.status}
              onClick={onTaskClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}
