import React from 'react';
import { Task } from '@/types/task.types';
import { ChevronDown, ChevronRight, MoreVertical, Clock } from 'lucide-react';
import {
  getPriorityBadge,
  getStatusBadge,
  formatDate,
  getInitials,
} from '@/utils/taskHelpers';

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
  const [collapsedPhases, setCollapsedPhases] = React.useState<Set<string>>(new Set());

  const togglePhase = (phaseId: string) => {
    setCollapsedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phaseId)) {
        next.delete(phaseId);
      } else {
        next.add(phaseId);
      }
      return next;
    });
  };

  // Get task type badge
  const getTaskTypeBadge = (taskType: string) => {
    const badges: Record<string, string> = {
      Task: 'bg-blue-100 text-blue-700 border-blue-200',
      Deliverable: 'bg-purple-100 text-purple-700 border-purple-200',
      Milestone: 'bg-green-100 text-green-700 border-green-200',
    };
    return badges[taskType] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  // Get task type icon
  const getTaskTypeIcon = (taskType: string) => {
    const icons: Record<string, string> = {
      Task: '📋',
      Deliverable: '📦',
      Milestone: '🎯',
    };
    return icons[taskType] || '📋';
  };

  // Group tasks by phase
  const tasksByPhase = React.useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    
    phases.forEach((phase) => {
      grouped[phase._id] = [];
    });
    
    grouped['unassigned'] = [];

    tasks.forEach((task) => {
      if (task.phaseId) {
        if (grouped[task.phaseId]) {
          grouped[task.phaseId].push(task);
        }
      } else {
        grouped['unassigned'].push(task);
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
      <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No phases or tasks yet
        </h3>
        <p className="text-gray-500">
          Create phases to organize your tasks, then add tasks to each phase
        </p>
      </div>
    );
  }

  const TaskRow = ({ task }: { task: Task }) => (
    <tr
      key={task._id}
      className="hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={() => onTaskClick(task)}
    >
      {/* Task Title */}
      <td className="px-6 py-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getTaskTypeIcon(task.taskType || 'Task')}</span>
            <span className="text-sm font-medium text-gray-900">
              {task.title}
            </span>
          </div>
          {task.description && (
            <span className="text-xs text-gray-500 mt-1 line-clamp-1">
              {task.description}
            </span>
          )}
        </div>
      </td>

      {/* Task Type & Duration - NEW COLUMN */}
      <td className="px-6 py-4">
        <div className="flex flex-col gap-1">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border w-fit ${getTaskTypeBadge(task.taskType || 'Task')}`}
          >
            {task.taskType || 'Task'}
          </span>
          {task.duration && (
            <span className="text-xs text-gray-600 flex items-center gap-1">
              <Clock size={12} />
              {task.duration} day{task.duration !== 1 ? 's' : ''}
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
      <td className="px-6 py-4 text-right w-24">
        <div className="dropdown-menu">
          <button
            id={`menu-button-${task._id}`}
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
            <div
              className="fixed bg-white rounded-lg shadow-xl border border-gray-200 z-50 w-48"
              style={{
                top: `${
                  (document
                    .getElementById(`menu-button-${task._id}`)
                    ?.getBoundingClientRect()?.bottom || 0) + 8
                }px`,
                left: `${
                  (document
                    .getElementById(`menu-button-${task._id}`)
                    ?.getBoundingClientRect()?.right || 0) - 192
                }px`,
              }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTaskClick(task);
                  setOpenDropdown(null);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 rounded-t-lg"
              >
                View Details
              </button>
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (
                      confirm(
                        'Are you sure you want to delete this task?',
                      )
                    ) {
                      onDelete(task._id);
                    }
                    setOpenDropdown(null);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 rounded-b-lg"
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="space-y-4">
      {/* Render phases in order */}
      {sortedPhases.map((phase) => {
        const phaseTasks = tasksByPhase[phase._id] || [];
        const isCollapsed = collapsedPhases.has(phase._id);

        return (
          <div key={phase._id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {/* Phase Header */}
            <div
              className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => togglePhase(phase._id)}
            >
              <div className="flex items-center gap-3">
                <button className="text-gray-600">
                  {isCollapsed ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
                </button>
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: phase.color || '#3B82F6' }}
                />
                <div>
                  <h3 className="font-semibold text-gray-900">{phase.name}</h3>
                  {phase.description && (
                    <p className="text-sm text-gray-600 mt-0.5">{phase.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-600">
                  {phaseTasks.length} {phaseTasks.length === 1 ? 'task' : 'tasks'}
                </span>
              </div>
            </div>

            {/* Phase Tasks */}
            {!isCollapsed && (
              <div className="overflow-x-auto">
                {phaseTasks.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <p className="text-sm">No tasks in this phase yet</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Task
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Type & Duration
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
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {phaseTasks.map((task) => (
                        <TaskRow key={task._id} task={task} />
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Unassigned Tasks */}
      {tasksByPhase['unassigned'] && tasksByPhase['unassigned'].length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div
            className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={() => togglePhase('unassigned')}
          >
            <div className="flex items-center gap-3">
              <button className="text-gray-600">
                {collapsedPhases.has('unassigned') ? (
                  <ChevronRight size={20} />
                ) : (
                  <ChevronDown size={20} />
                )}
              </button>
              <div className="w-4 h-4 rounded-full bg-gray-400" />
              <div>
                <h3 className="font-semibold text-gray-900">Unassigned</h3>
                <p className="text-sm text-gray-600 mt-0.5">
                  Tasks not assigned to any phase
                </p>
              </div>
            </div>
            <span className="text-sm font-medium text-gray-600">
              {tasksByPhase['unassigned'].length}{' '}
              {tasksByPhase['unassigned'].length === 1 ? 'task' : 'tasks'}
            </span>
          </div>

          {!collapsedPhases.has('unassigned') && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Task
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Type & Duration
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
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {tasksByPhase['unassigned'].map((task) => (
                    <TaskRow key={task._id} task={task} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}