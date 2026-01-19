import React from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Flag, User } from 'lucide-react';

interface Task {
  _id: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: string;
  assignees: { name: string; email: string }[];
  projectId: {
    _id: string;
    projectName: string;
    brand: string;
  };
}

interface ActiveTasksListProps {
  tasks: Task[];
}

export default function ActiveTasksList({ tasks }: ActiveTasksListProps) {
  const router = useRouter();

  const statusColors: { [key: string]: string } = {
    'Backlog': 'bg-gray-100 text-gray-700',
    'In Progress': 'bg-blue-100 text-blue-700',
    'Blocked': 'bg-red-100 text-red-700',
  };

  const priorityColors: { [key: string]: string } = {
    'Low': 'bg-gray-100 text-gray-700',
    'Medium': 'bg-yellow-100 text-yellow-700',
    'High': 'bg-orange-100 text-orange-700',
    'Critical': 'bg-red-100 text-red-700',
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return <span className="text-red-600 font-medium">Overdue</span>;
    if (diffDays === 0) return <span className="text-orange-600 font-medium">Due today</span>;
    if (diffDays === 1) return <span className="text-yellow-600 font-medium">Due tomorrow</span>;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Active Tasks</h2>
        <p className="text-sm text-gray-500 mt-1">Tasks in progress or pending</p>
      </div>

      {tasks.length === 0 ? (
        <div className="px-6 py-12 text-center text-gray-500">
          <p className="font-semibold mb-2">No active tasks</p>
          <p className="text-sm">All tasks are completed!</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Task
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Assignee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Due Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tasks.map((task) => (
                <tr
                  key={task._id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/admin/projects/${task.projectId._id}/tasks`)}
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{task.title}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">{task.projectId.projectName}</div>
                      <div className="text-gray-500">{task.projectId.brand}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        statusColors[task.status]
                      }`}
                    >
                      {task.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        priorityColors[task.priority]
                      }`}
                    >
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <User size={14} className="text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {task.assignees.length > 0
                          ? task.assignees[0].name
                          : 'Unassigned'}
                      </span>
                      {task.assignees.length > 1 && (
                        <span className="text-xs text-gray-500">
                          +{task.assignees.length - 1}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar size={14} className="text-gray-400" />
                      {formatDate(task.dueDate)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}