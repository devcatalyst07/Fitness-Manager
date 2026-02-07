"use client";

import React, { useState, useMemo } from "react";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  eachWeekOfInterval,
  format,
  isToday,
  differenceInDays,
  addDays,
  subDays,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Task } from "@/types/task.types";

interface TimelineHeaderProps {
  currentDate: Date;
  viewMode: "week" | "month";
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onViewModeChange: (mode: "week" | "month") => void;
}

export function TimelineHeader({
  currentDate,
  viewMode,
  onPrevious,
  onNext,
  onToday,
  onViewModeChange,
}: TimelineHeaderProps) {
  const title =
    viewMode === "week"
      ? `Week of ${format(startOfWeek(currentDate), "MMM d, yyyy")}`
      : format(currentDate, "MMMM yyyy");

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onToday}
          className="px-3 py-1.5 text-sm font-medium border border-gray-300 rounded hover:bg-gray-50"
        >
          Today
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={onPrevious}
            className="p-1.5 hover:bg-gray-100 rounded"
          >
            <ChevronLeft size={18} />
          </button>
          <button onClick={onNext} className="p-1.5 hover:bg-gray-100 rounded">
            <ChevronRight size={18} />
          </button>
        </div>
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onViewModeChange("week")}
          className={`px-3 py-1.5 text-sm font-medium rounded ${
            viewMode === "week"
              ? "bg-blue-600 text-white"
              : "border border-gray-300 hover:bg-gray-50"
          }`}
        >
          Week
        </button>
        <button
          onClick={() => onViewModeChange("month")}
          className={`px-3 py-1.5 text-sm font-medium rounded ${
            viewMode === "month"
              ? "bg-blue-600 text-white"
              : "border border-gray-300 hover:bg-gray-50"
          }`}
        >
          Month
        </button>
      </div>
    </div>
  );
}

interface TimelineGridProps {
  tasks: Task[];
  currentDate: Date;
  viewMode: "week" | "month";
  onTaskClick: (task: Task) => void;
}

export function TimelineGrid({
  tasks,
  currentDate,
  viewMode,
  onTaskClick,
}: TimelineGridProps) {
  const { days, startDate, endDate } = useMemo(() => {
    if (viewMode === "week") {
      const start = startOfWeek(currentDate);
      const end = endOfWeek(currentDate);
      return {
        days: eachDayOfInterval({ start, end }),
        startDate: start,
        endDate: end,
      };
    } else {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      const weeks = eachWeekOfInterval({ start, end });
      return {
        days: weeks,
        startDate: start,
        endDate: end,
      };
    }
  }, [currentDate, viewMode]);

  const visibleTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (!task.startDate || !task.dueDate) return false;
      const taskStart = new Date(task.startDate);
      const taskEnd = new Date(task.dueDate);
      return taskStart <= endDate && taskEnd >= startDate;
    });
  }, [tasks, startDate, endDate]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "bg-red-500";
      case "High":
        return "bg-orange-500";
      case "Medium":
        return "bg-yellow-500";
      case "Low":
        return "bg-green-500";
      default:
        return "bg-gray-400";
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      Critical: "bg-red-100 text-red-700",
      High: "bg-orange-100 text-orange-700",
      Medium: "bg-yellow-100 text-yellow-700",
      Low: "bg-green-100 text-green-700",
    };
    return colors[priority] || "bg-gray-100 text-gray-700";
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      Done: "bg-green-100 text-green-700",
      "In Progress": "bg-blue-100 text-blue-700",
      Blocked: "bg-red-100 text-red-700",
      Backlog: "bg-gray-100 text-gray-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  const getTaskTypeIcon = (taskType: string) => {
    const icons: Record<string, string> = {
      Task: "📋",
      Deliverable: "📦",
      Milestone: "🎯",
    };
    return icons[taskType] || "📋";
  };

  const getTaskPosition = (task: Task) => {
    const taskStart = new Date(task.startDate!);
    const taskEnd = new Date(task.dueDate!);
    const displayStart = taskStart < startDate ? startDate : taskStart;
    const displayEnd = taskEnd > endDate ? endDate : taskEnd;
    const totalDays = differenceInDays(endDate, startDate);
    const startOffset = differenceInDays(displayStart, startDate);
    const duration = differenceInDays(displayEnd, displayStart) + 1;
    const left = (startOffset / totalDays) * 100;
    const width = (duration / totalDays) * 100;
    return { left: `${left}%`, width: `${width}%` };
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 border-b">
        <div className="grid" style={{ gridTemplateColumns: "200px 1fr" }}>
          <div className="p-3 border-r font-semibold text-sm text-gray-700">
            Task Name
          </div>
          <div
            className="grid"
            style={{ gridTemplateColumns: `repeat(${days.length}, 1fr)` }}
          >
            {days.map((day, idx) => (
              <div
                key={idx}
                className={`p-3 text-center border-r last:border-r-0 ${
                  isToday(day) ? "bg-blue-50" : ""
                }`}
              >
                <div className="text-xs text-gray-500 uppercase">
                  {viewMode === "week"
                    ? format(day, "EEE")
                    : `Week ${format(day, "w")}`}
                </div>
                <div
                  className={`text-sm font-semibold ${isToday(day) ? "text-blue-600" : ""}`}
                >
                  {viewMode === "week"
                    ? format(day, "d")
                    : format(day, "MMM d")}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div>
        {visibleTasks.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="text-lg font-medium">No tasks in this period</p>
            <p className="text-sm">Tasks with dates will appear here</p>
          </div>
        ) : (
          visibleTasks.map((task) => {
            const position = getTaskPosition(task);
            const assigneeCount = task.assignees?.length || 0;
            const dependencyCount = task.dependencies?.length || 0;

            return (
              <div
                key={task._id}
                className="grid border-b last:border-b-0 hover:bg-gray-50"
                style={{ gridTemplateColumns: "200px 1fr" }}
              >
                {/* Left: Task Info */}
                <div className="p-3 border-r">
                  <div
                    className="font-medium text-sm mb-1 truncate flex items-center gap-1"
                    title={task.title}
                  >
                    <span>{getTaskTypeIcon(task.taskType || 'Task')}</span>
                    <span>{task.title}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded-full font-medium ${getPriorityBadge(task.priority)}`}
                    >
                      {task.priority}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-medium ${getStatusBadge(task.status)}`}
                    >
                      {task.status}
                    </span>
                    {task.duration && (
                      <span className="text-gray-500">
                        {task.duration}d
                      </span>
                    )}
                    {dependencyCount > 0 && (
                      <span className="text-gray-500">
                        {dependencyCount} {dependencyCount === 1 ? "dep" : "deps"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Timeline Bar */}
                <div className="relative h-16 flex items-center px-2">
                  {/* Today Line */}
                  {days.some((day) => isToday(day)) && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-blue-600 z-20"
                      style={{
                        left: `${(differenceInDays(new Date(), startDate) / differenceInDays(endDate, startDate)) * 100}%`,
                      }}
                    >
                      <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-600 rounded-full"></div>
                    </div>
                  )}

                  {/* Task Bar */}
                  <div
                    onClick={() => onTaskClick(task)}
                    className={`absolute h-7 rounded cursor-pointer hover:opacity-90 transition-opacity ${getPriorityColor(task.priority)} flex items-center justify-between px-3 text-white text-xs font-medium shadow`}
                    style={position}
                  >
                    <span className="truncate flex-1">{task.title}</span>
                    <span className="ml-2 font-semibold bg-black bg-opacity-20 px-1.5 py-0.5 rounded whitespace-nowrap">
                      {task.progress}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

interface TimelineContainerProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export function TimelineContainer({
  tasks,
  onTaskClick,
}: TimelineContainerProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"week" | "month">("week");

  const handlePrevious = () => {
    if (viewMode === "week") {
      setCurrentDate(subDays(currentDate, 7));
    } else {
      setCurrentDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth() - 1),
      );
    }
  };

  const handleNext = () => {
    if (viewMode === "week") {
      setCurrentDate(addDays(currentDate, 7));
    } else {
      setCurrentDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth() + 1),
      );
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div>
      <TimelineHeader
        currentDate={currentDate}
        viewMode={viewMode}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onToday={handleToday}
        onViewModeChange={setViewMode}
      />
      <TimelineGrid
        tasks={tasks}
        currentDate={currentDate}
        viewMode={viewMode}
        onTaskClick={onTaskClick}
      />
    </div>
  );
}