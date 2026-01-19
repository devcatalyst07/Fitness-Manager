import React from "react";
import { Task, TaskStatus } from "@/types/task.types";
import {
  getPriorityBadge,
  getStatusBadge,
  formatDate,
  getInitials,
} from "@/utils/taskHelpers";

interface TaskBoardViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
}

export default function TaskBoardView({
  tasks,
  onTaskClick,
  onStatusChange,
}: TaskBoardViewProps) {
  const columns: { status: TaskStatus; title: string}[] = [
    { status: "Backlog", title: "Backlog"},
    { status: "In Progress", title: "In Progress"},
    { status: "Blocked", title: "Blocked"},
    { status: "Done", title: "Done"},
  ];

  const getTasksByStatus = (status: TaskStatus): Task[] => {
    return tasks.filter((task) => task.status === status);
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    e.dataTransfer.setData("taskId", task._id);
    e.dataTransfer.setData("currentStatus", task.status);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    const currentStatus = e.dataTransfer.getData("currentStatus");

    if (currentStatus !== newStatus && onStatusChange) {
      if (
        confirm(`Are you sure you want to move this task to "${newStatus}"?`)
      ) {
        onStatusChange(taskId, newStatus);
      }
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {columns.map((column) => {
        const columnTasks = getTasksByStatus(column.status);

        return (
          <div
            key={column.status}
            className="bg-gray-50 rounded-lg border border-gray-200"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.status)}
          >
            {/* Column Header */}
            <div className="p-4 border-b border-gray-300 bg-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl"></span>
                  <h3 className="font-semibold text-gray-900">
                    {column.title}
                  </h3>
                </div>
                <span className="bg-gray-200 text-gray-700 text-xs font-semibold px-2 py-1 rounded-full">
                  {columnTasks.length}
                </span>
              </div>
            </div>

            {/* Column Body */}
            <div className="p-4 space-y-3 min-h-[400px]">
              {columnTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No tasks in {column.title.toLowerCase()}
                </div>
              ) : (
                columnTasks.map((task) => (
                  <div
                    key={task._id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    onClick={() => onTaskClick(task)}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-move"
                  >
                    {/* Task Title */}
                    <h4 className="font-medium text-gray-900 mb-2">
                      {task.title}
                    </h4>

                    {/* Task Description */}
                    {task.description && (
                      <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    {/* Priority & Status Badges */}
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getPriorityBadge(task.priority)}`}
                      >
                        {task.priority}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600">Progress</span>
                        <span className="text-xs font-medium text-gray-700">
                          {task.progress}%
                        </span>
                      </div>
                      <div className="bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full transition-all"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Footer: Assignees & Due Date */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      {/* Assignees */}
                      <div className="flex -space-x-2">
                        {task.assignees && task.assignees.length > 0 ? (
                          <>
                            {task.assignees.slice(0, 2).map((assignee, idx) => (
                              <div
                                key={idx}
                                className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold border-2 border-white"
                                title={assignee.name}
                              >
                                {getInitials(assignee.name)}
                              </div>
                            ))}
                            {task.assignees.length > 2 && (
                              <div className="w-6 h-6 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center text-xs font-semibold border-2 border-white">
                                +{task.assignees.length - 2}
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-gray-400">
                            Unassigned
                          </span>
                        )}
                      </div>

                      {/* Due Date */}
                      {task.dueDate && (
                        <span className="text-xs text-gray-500">
                           {formatDate(task.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}