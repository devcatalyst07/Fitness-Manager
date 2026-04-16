import React from "react";
import { Task } from "@/types/task.types";
import {
  getPriorityBadge,
  getStatusBadge,
  formatDate,
  getInitials,
} from "@/utils/taskHelpers";

interface Phase {
  _id: string;
  name: string;
  description?: string;
  order: number;
  color?: string;
  projectId: string;
}

interface TaskPhaseViewProps {
  tasks: Task[];
  phases: Phase[];
  onTaskClick: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  openDropdown: string | null;
  setOpenDropdown: (id: string | null) => void;
}

export default function TaskPhaseView({
  tasks,
  phases,
  onTaskClick,
  onDelete,
  openDropdown,
  setOpenDropdown,
}: TaskPhaseViewProps) {
  const [collapsedPhases, setCollapsedPhases] = React.useState<Set<string>>(
    new Set()
  );

  const togglePhase = (phaseId: string) => {
    setCollapsedPhases((prev) => {
      const next = new Set(prev);
      next.has(phaseId) ? next.delete(phaseId) : next.add(phaseId);
      return next;
    });
  };

  const getTaskTypeBadge = (taskType: string) => {
    const badges: Record<string, string> = {
      Task: "bg-blue-50 text-blue-800 border-blue-200",
      Deliverable: "bg-purple-50 text-purple-800 border-purple-200",
      Milestone: "bg-emerald-50 text-emerald-800 border-emerald-200",
    };
    return badges[taskType] || "bg-gray-50 text-gray-700 border-gray-200";
  };

  const tasksByPhase = React.useMemo(() => {
    const grouped: Record<string, Task[]> = {};

    phases.forEach((phase) => {
      grouped[phase._id] = [];
    });
    grouped["unassigned"] = [];

    tasks.forEach((task) => {
      if (task.phaseId && grouped[task.phaseId]) {
        grouped[task.phaseId].push(task);
      } else {
        grouped["unassigned"].push(task);
      }
    });

    Object.keys(grouped).forEach((phaseId) => {
      grouped[phaseId].sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    });

    return grouped;
  }, [tasks, phases]);

  const sortedPhases = [...phases].sort((a, b) => a.order - b.order);

  if (tasks.length === 0 && phases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center bg-white border border-gray-200 rounded-xl p-16 text-center">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">
          No phases or tasks yet
        </h3>
        <p className="text-sm text-gray-500 max-w-xs">
          Create phases to organize your tasks, then add tasks to each phase.
        </p>
      </div>
    );
  }

  const TABLE_HEADERS = [
    { label: "Task", className: "w-[28%] text-left" },
    { label: "Type & Duration", className: "w-[14%] text-left" },
    { label: "Status", className: "w-[11%] text-left" },
    { label: "Priority", className: "w-[10%] text-left" },
    { label: "Assignees", className: "w-[12%] text-left" },
    { label: "Due Date", className: "w-[11%] text-left" },
    { label: "Progress", className: "w-[10%] text-left" },
    { label: "", className: "w-[4%] text-right" },
  ];

  const TaskRow = ({ task }: { task: Task }) => {
    const menuButtonId = `menu-btn-${task._id}`;

    return (
      <tr
        className="group hover:bg-gray-50/70 transition-colors cursor-pointer"
        onClick={() => onTaskClick(task)}
      >
        {/* Task */}
        <td className="px-4 py-3 align-middle">
          <p className="text-sm font-medium text-gray-900 leading-snug truncate max-w-[220px]">
            {task.title}
          </p>
          {task.description && (
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[220px]">
              {task.description}
            </p>
          )}
        </td>

        {/* Type & Duration */}
        <td className="px-4 py-3 align-middle">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${getTaskTypeBadge(task.taskType || "Task")}`}
          >
            {task.taskType || "Task"}
          </span>
          {task.duration && (
            <p className="text-[11px] text-gray-400 mt-1">
              {task.duration} day{task.duration !== 1 ? "s" : ""}
            </p>
          )}
        </td>

        {/* Status */}
        <td className="px-4 py-3 align-middle">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${getStatusBadge(task.status)}`}
          >
            {task.status}
          </span>
        </td>

        {/* Priority */}
        <td className="px-4 py-3 align-middle">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${getPriorityBadge(task.priority)}`}
          >
            {task.priority}
          </span>
        </td>

        {/* Assignees */}
        <td className="px-4 py-3 align-middle">
          {task.assignees && task.assignees.length > 0 ? (
            <div className="flex items-center -space-x-1.5">
              {task.assignees.slice(0, 3).map((assignee, idx) => (
                <div
                  key={idx}
                  title={assignee.name}
                  className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-semibold ring-2 ring-white"
                >
                  {getInitials(assignee.name)}
                </div>
              ))}
              {task.assignees.length > 3 && (
                <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-[10px] font-semibold ring-2 ring-white">
                  +{task.assignees.length - 3}
                </div>
              )}
            </div>
          ) : (
            <span className="text-xs text-gray-400">—</span>
          )}
        </td>

        {/* Due Date */}
        <td className="px-4 py-3 align-middle">
          <span className="text-xs text-gray-600">{formatDate(task.dueDate)}</span>
        </td>

        {/* Progress */}
        <td className="px-4 py-3 align-middle">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-blue-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${task.progress ?? 0}%` }}
              />
            </div>
            <span className="text-[11px] text-gray-500 w-7 text-right shrink-0">
              {task.progress ?? 0}%
            </span>
          </div>
        </td>

        {/* Actions */}
        <td className="px-4 py-3 align-middle text-right relative">
          <button
            id={menuButtonId}
            onClick={(e) => {
              e.stopPropagation();
              setOpenDropdown(openDropdown === task._id ? null : task._id);
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-gray-100 text-gray-500"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm0 5.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm0 5.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" />
            </svg>
          </button>

          {openDropdown === task._id && (
            <div
              className="fixed z-50 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1 text-left"
              style={{
                top: `${(document.getElementById(menuButtonId)?.getBoundingClientRect().bottom ?? 0) + 6}px`,
                left: `${(document.getElementById(menuButtonId)?.getBoundingClientRect().right ?? 0) - 176}px`,
              }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTaskClick(task);
                  setOpenDropdown(null);
                }}
                className="w-full px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View details
              </button>
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Are you sure you want to delete this task?")) {
                      onDelete(task._id);
                    }
                    setOpenDropdown(null);
                  }}
                  className="w-full px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <svg className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete task
                </button>
              )}
            </div>
          )}
        </td>
      </tr>
    );
  };

  const PhaseTable = ({ phaseId }: { phaseId: string }) => {
    const phaseTasks = tasksByPhase[phaseId] || [];
    const isCollapsed = collapsedPhases.has(phaseId);
    if (isCollapsed) return null;

    return (
      <div className="overflow-x-auto">
        {phaseTasks.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-gray-400">No tasks in this phase yet</p>
          </div>
        ) : (
          <table className="w-full min-w-[900px] border-collapse">
            <thead>
              <tr className="border-b border-gray-100">
                {TABLE_HEADERS.map((h, i) => (
                  <th
                    key={i}
                    className={`px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400 bg-gray-50/50 ${h.className}`}
                  >
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {phaseTasks.map((task, idx) => (
                <TaskRow
                  key={`${task._id ?? `${task.title}-${task.dueDate ?? "nd"}`}-${idx}`}
                  task={task}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {sortedPhases.map((phase, phaseIndex) => {
        const phaseTasks = tasksByPhase[phase._id] || [];
        const isCollapsed = collapsedPhases.has(phase._id);

        return (
          <div
            key={`${phase._id ?? phase.name}-${phaseIndex}`}
            className="bg-white border border-gray-200 rounded-xl overflow-hidden"
          >
            {/* Phase header */}
            <button
              type="button"
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
              onClick={() => togglePhase(phase._id)}
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Chevron */}
                <svg
                  className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform duration-200 ${isCollapsed ? "-rotate-90" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>

                {/* Color dot */}
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: phase.color ?? "#3B82F6" }}
                />

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{phase.name}</p>
                  {phase.description && (
                    <p className="text-xs text-gray-400 truncate">{phase.description}</p>
                  )}
                </div>
              </div>

              <span className="ml-4 shrink-0 text-xs font-medium text-gray-400 bg-gray-100 rounded-full px-2.5 py-0.5">
                {phaseTasks.length} {phaseTasks.length === 1 ? "task" : "tasks"}
              </span>
            </button>

            <PhaseTable phaseId={phase._id} />
          </div>
        );
      })}

      {/* Unassigned tasks */}
      {(tasksByPhase["unassigned"]?.length ?? 0) > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <button
            type="button"
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
            onClick={() => togglePhase("unassigned")}
          >
            <div className="flex items-center gap-3">
              <svg
                className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform duration-200 ${collapsedPhases.has("unassigned") ? "-rotate-90" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              <span className="w-2.5 h-2.5 rounded-full bg-gray-300 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-900">Unassigned</p>
                <p className="text-xs text-gray-400">Tasks not assigned to any phase</p>
              </div>
            </div>
            <span className="ml-4 shrink-0 text-xs font-medium text-gray-400 bg-gray-100 rounded-full px-2.5 py-0.5">
              {tasksByPhase["unassigned"].length}{" "}
              {tasksByPhase["unassigned"].length === 1 ? "task" : "tasks"}
            </span>
          </button>

          <PhaseTable phaseId="unassigned" />
        </div>
      )}
    </div>
  );
}