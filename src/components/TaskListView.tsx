import React from "react";
import { Task } from "@/types/task.types";
import {
  getPriorityBadge,
  getStatusBadge,
  formatDate,
  getInitials,
} from "@/utils/taskHelpers";
import { MoreVertical } from "lucide-react";

interface TaskListViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  openDropdown: string | null;
  setOpenDropdown: (id: string | null) => void;
}

export default function TaskListView({
  tasks,
  onTaskClick,
  onEdit,
  onDelete,
  openDropdown,
  setOpenDropdown,
}: TaskListViewProps) {
  if (tasks.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
        <div className="text-6xl mb-4">📋</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No tasks yet
        </h3>
        <p className="text-gray-500">
          Create your first task to get started with project management
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Task
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Assignees
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Due Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Progress
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {tasks.map((task) => (
              <tr
                key={task._id}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onTaskClick(task)}
              >
                {/* Task Title */}
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">
                      {task.title}
                    </span>
                    {task.description && (
                      <span className="text-xs text-gray-500 mt-1 line-clamp-1">
                        {task.description}
                      </span>
                    )}
                  </div>
                </td>

                {/* Status */}
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadge(task.status)}`}
                  >
                    {task.status}
                  </span>
                </td>

                {/* Priority */}
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getPriorityBadge(task.priority)}`}
                  >
                    {task.priority}
                  </span>
                </td>

                {/* Assignees */}
                <td className="px-6 py-4">
                  <div className="flex -space-x-2">
                    {task.assignees && task.assignees.length > 0 ? (
                      <>
                        {task.assignees.slice(0, 3).map((assignee, idx) => (
                          <div
                            key={idx}
                            className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold border-2 border-white"
                            title={assignee.name}
                          >
                            {getInitials(assignee.name)}
                          </div>
                        ))}
                        {task.assignees.length > 3 && (
                          <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center text-xs font-semibold border-2 border-white">
                            +{task.assignees.length - 3}
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="text-sm text-gray-400">Unassigned</span>
                    )}
                  </div>
                </td>

                {/* Due Date */}
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-700">
                    {formatDate(task.dueDate)}
                  </span>
                </td>

                {/* Progress */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-700 min-w-[40px] text-right">
                      {task.progress}%
                    </span>
                  </div>
                </td>

                {/* Actions */}
                <td className="px-6 py-4 text-right">
                  <div className="relative dropdown-menu">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenDropdown(
                          openDropdown === task._id ? null : task._id,
                        );
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <MoreVertical size={16} className="text-gray-600" />
                    </button>

                    {openDropdown === task._id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onTaskClick(task);
                            setOpenDropdown(null);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                           View Details
                        </button>
                        {/* {onEdit && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(task);
                              setOpenDropdown(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                             Edit
                          </button>
                        )} */}
                        {onDelete && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (
                                confirm(
                                  "Are you sure you want to delete this task?",
                                )
                              ) {
                                onDelete(task._id);
                              }
                              setOpenDropdown(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                             Delete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}