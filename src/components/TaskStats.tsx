import React from "react";
import { Task } from "@/types/task.types";
import { calculateTaskStats } from "@/utils/taskHelpers";

interface TaskStatsProps {
  tasks: Task[];
}

export default function TaskStats({ tasks }: TaskStatsProps) {
  const stats = calculateTaskStats(tasks);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {/* Total Tasks */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-600">Total Tasks</p>
          <span className="text-2xl"></span>
        </div>
        <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
        <p className="text-xs text-gray-500 mt-1">All tasks in project</p>
      </div>

      {/* In Progress */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-600">In Progress</p>
          <span className="text-2xl"></span>
        </div>
        <p className="text-3xl font-bold text-blue-600">{stats.inProgress}</p>
        <p className="text-xs text-gray-500 mt-1">Currently being worked on</p>
      </div>

      {/* Blocked */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-600">Blocked</p>
          <span className="text-2xl"></span>
        </div>
        <p className="text-3xl font-bold text-red-600">{stats.blocked}</p>
        <p className="text-xs text-gray-500 mt-1">Requires attention</p>
      </div>

      {/* Completed */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-600">Completed</p>
          <span className="text-2xl"></span>
        </div>
        <p className="text-3xl font-bold text-green-600">{stats.done}</p>
        <p className="text-xs text-gray-500 mt-1">Successfully finished</p>
      </div>

      {/* Completion Rate */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-600">Completion</p>
          <span className="text-2xl"></span>
        </div>
        <p className="text-3xl font-bold text-purple-600">
          {stats.completionRate}%
        </p>
        <div className="mt-2 bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-purple-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${stats.completionRate}%` }}
          />
        </div>
      </div>
    </div>
  );
}