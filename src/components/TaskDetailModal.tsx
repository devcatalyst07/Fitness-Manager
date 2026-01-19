import React, { useState } from "react";
import { X, Calendar, Flag, Users, FileText, Clock, Send } from "lucide-react";
import { Task, Comment, ActivityLog, TeamMember } from "@/types/task.types";
import {
  getPriorityBadge,
  getStatusBadge,
  formatDate,
  formatRelativeTime,
  getInitials,
} from "@/utils/taskHelpers";

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  activeTab: "details" | "comments" | "activity";
  setActiveTab: (tab: "details" | "comments" | "activity") => void;
  comments: Comment[];
  activityLogs: ActivityLog[];
  newComment: string;
  setNewComment: (comment: string) => void;
  onAddComment: () => void;
  onUpdateTask?: (taskId: string, data: Partial<Task>) => void;
  teamMembers?: TeamMember[];
  isEditing?: boolean;
  setIsEditing?: (editing: boolean) => void;
  selectedFiles?: File[];
  onFileSelect?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile?: (index: number) => void;
}

export default function TaskDetailModal({
  isOpen,
  onClose,
  task,
  activeTab,
  setActiveTab,
  comments,
  activityLogs,
  newComment,
  setNewComment,
  onAddComment,
  onUpdateTask,
  teamMembers = [],
  isEditing = false,
  setIsEditing,
  selectedFiles = [],
  onFileSelect,
  onRemoveFile,
}: TaskDetailModalProps) {
  const [editedTask, setEditedTask] = useState<Partial<Task>>({});

  if (!isOpen || !task) return null;

  const handleEdit = () => {
    setEditedTask(task);
    setIsEditing?.(true);
  };

  const handleSave = () => {
    if (onUpdateTask && editedTask._id) {
      onUpdateTask(editedTask._id, editedTask);
      setIsEditing?.(false);
    }
  };

  const handleCancel = () => {
    setEditedTask({});
    setIsEditing?.(false);
  };

  const currentTask = isEditing ? editedTask : task;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex-1">
                {isEditing ? (
                  <input
                    type="text"
                    value={editedTask.title || ""}
                    onChange={(e) =>
                      setEditedTask({ ...editedTask, title: e.target.value })
                    }
                    className="text-xl font-semibold text-gray-900 px-3 py-1 rounded border border-gray-300 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <h2 className="text-xl font-semibold text-gray-900">
                    {task.title}
                  </h2>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(currentTask.status || task.status)}`}
                  >
                    {currentTask.status || task.status}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityBadge(currentTask.priority || task.priority)}`}
                  >
                    {currentTask.priority || task.priority}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!isEditing && setIsEditing && (
                <button
                  onClick={handleEdit}
                  className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 py-2 rounded-lg transition-all text-sm font-medium"
                >
                  Edit
                </button>
              )}
              <button
                onClick={onClose}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-2 rounded-lg transition-all"
              >
                <X size={24} />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex gap-1 px-6">
            <button
              onClick={() => setActiveTab("details")}
              className={`px-4 py-3 text-sm font-medium transition-all ${
                activeTab === "details"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab("comments")}
              className={`px-4 py-3 text-sm font-medium transition-all ${
                activeTab === "comments"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Comments ({comments.length})
            </button>
            <button
              onClick={() => setActiveTab("activity")}
              className={`px-4 py-3 text-sm font-medium transition-all ${
                activeTab === "activity"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Activity ({activityLogs.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "details" && (
            <div className="space-y-6">
              {/* Description */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <FileText size={16} />
                  Description
                </label>
                {isEditing ? (
                  <textarea
                    value={editedTask.description || ""}
                    onChange={(e) =>
                      setEditedTask({
                        ...editedTask,
                        description: e.target.value,
                      })
                    }
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-xl">
                    {task.description || "No description provided"}
                  </p>
                )}
              </div>

              {/* Status & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Flag size={16} />
                    Status
                  </label>
                  {isEditing ? (
                    <select
                      value={editedTask.status || task.status}
                      onChange={(e) =>
                        setEditedTask({
                          ...editedTask,
                          status: e.target.value as any,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Backlog">Backlog</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Blocked">Blocked</option>
                      <option value="Done">Done</option>
                    </select>
                  ) : (
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-xl">
                      {task.status}
                    </p>
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Flag size={16} />
                    Priority
                  </label>
                  {isEditing ? (
                    <select
                      value={editedTask.priority || task.priority}
                      onChange={(e) =>
                        setEditedTask({
                          ...editedTask,
                          priority: e.target.value as any,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Low">🟢 Low</option>
                      <option value="Medium">🟡 Medium</option>
                      <option value="High">🟠 High</option>
                      <option value="Critical">🔴 Critical</option>
                    </select>
                  ) : (
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-xl">
                      {task.priority}
                    </p>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Calendar size={16} />
                    Start Date
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={
                        editedTask.startDate
                          ? editedTask.startDate.split("T")[0]
                          : task.startDate
                            ? task.startDate.split("T")[0]
                            : ""
                      }
                      onChange={(e) =>
                        setEditedTask({
                          ...editedTask,
                          startDate: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-xl">
                      {formatDate(task.startDate)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Calendar size={16} />
                    Due Date
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={
                        editedTask.dueDate
                          ? editedTask.dueDate.split("T")[0]
                          : task.dueDate
                            ? task.dueDate.split("T")[0]
                            : ""
                      }
                      onChange={(e) =>
                        setEditedTask({
                          ...editedTask,
                          dueDate: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-xl">
                      {formatDate(task.dueDate)}
                    </p>
                  )}
                </div>
              </div>

              {/* Assignees */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Users size={16} />
                  Assignees
                </label>

                {isEditing ? (
                  <div>
                    {/* Add assignee dropdown */}
                    <select
                      onChange={(e) => {
                        const selectedMember = teamMembers?.find(
                          (member) => member.userId.email === e.target.value,
                        );

                        if (selectedMember) {
                          const currentAssignees =
                            editedTask.assignees || task.assignees || [];
                          const alreadyAssigned = currentAssignees.some(
                            (a) => a.email === selectedMember.userId.email,
                          );

                          if (alreadyAssigned) {
                            alert("This member is already assigned!");
                            return;
                          }

                          const newAssignee = {
                            email: selectedMember.userId.email,
                            name: selectedMember.userId.name,
                          };

                          setEditedTask({
                            ...editedTask,
                            assignees: [...currentAssignees, newAssignee],
                          });
                        }

                        e.target.value = "";
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                    >
                      <option value="">+ Add team member</option>
                      {teamMembers
                        ?.filter((member) => member.status === "active")
                        .map((member) => (
                          <option key={member._id} value={member.userId.email}>
                            {member.userId.name}
                          </option>
                        ))}
                    </select>

                    {/* Display assignees with remove button */}
                    {(editedTask.assignees || task.assignees) &&
                    (editedTask.assignees || task.assignees).length > 0 ? (
                      <div className="space-y-2">
                        {(editedTask.assignees || task.assignees).map(
                          (assignee, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                                  {getInitials(assignee.name)}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {assignee.name}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {assignee.email}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  const currentAssignees =
                                    editedTask.assignees || task.assignees;
                                  const updated = currentAssignees.filter(
                                    (_, i) => i !== idx,
                                  );
                                  setEditedTask({
                                    ...editedTask,
                                    assignees: updated,
                                  });
                                }}
                                className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all"
                              >
                                <X size={18} />
                              </button>
                            </div>
                          ),
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 py-4">
                        No team members assigned yet
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {task.assignees && task.assignees.length > 0 ? (
                      task.assignees.map((assignee, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg"
                        >
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                            {getInitials(assignee.name)}
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {assignee.name}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">No assignees</p>
                    )}
                  </div>
                )}
              </div>

              {/* Progress */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Clock size={16} />
                  Progress: {currentTask.progress || task.progress}%
                </label>
                {isEditing ? (
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={editedTask.progress || task.progress}
                      onChange={(e) =>
                        setEditedTask({
                          ...editedTask,
                          progress: parseInt(e.target.value),
                        })
                      }
                      className="flex-1"
                    />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editedTask.progress || task.progress}
                      onChange={(e) =>
                        setEditedTask({
                          ...editedTask,
                          progress: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center"
                    />
                  </div>
                ) : null}
                <div className="mt-3 bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${currentTask.progress || task.progress}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "comments" && (
            <div className="space-y-4">
              {/* Comment Input */}
              <div className="sticky top-0 bg-white pb-4 border-b">
                <div className="flex gap-3 mb-3">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={(e) => {
                      if (
                        e.key === "Enter" &&
                        (newComment.trim() || selectedFiles?.length > 0)
                      ) {
                        onAddComment();
                      }
                    }}
                    placeholder="Write a comment..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={onAddComment}
                    disabled={
                      !newComment.trim() &&
                      (!selectedFiles || selectedFiles.length === 0)
                    }
                    className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                  >
                    <Send size={18} />
                  </button>
                </div>

                {/* File Attachment */}
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors text-sm">
                    <FileText size={16} />
                    <span>Attach Files</span>
                    <input
                      type="file"
                      multiple
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files && onFileSelect) {
                          onFileSelect(e as any);
                        }
                      }}
                      className="hidden"
                    />
                  </label>

                  {selectedFiles && selectedFiles.length > 0 && (
                    <div className="flex-1 flex flex-wrap gap-2">
                      {Array.from(selectedFiles).map(
                        (file: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-1 rounded-lg text-sm"
                          >
                            <span className="truncate max-w-[150px]">
                              {file.name}
                            </span>
                            <button
                              onClick={() => {
                                if (onRemoveFile) {
                                  onRemoveFile(idx);
                                }
                              }}
                              className="text-red-600 hover:text-red-800"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ),
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Comments List */}
              <div className="space-y-4">
                {comments.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p>No comments yet. Be the first to comment!</p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div
                      key={comment._id}
                      className="flex gap-3 bg-gray-50 p-4 rounded-xl"
                    >
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                        {getInitials(comment.userId.name)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900">
                            {comment.userId.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatRelativeTime(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-gray-700 mb-2">{comment.comment}</p>

                        {/* File Attachments */}
                        {(comment as any).attachments &&
                          (comment as any).attachments.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-xs font-medium text-gray-600 mb-2">
                                Attachments (
                                {(comment as any).attachments.length}):
                              </p>
                              <div className="space-y-1">
                                {(comment as any).attachments.map(
                                  (file: any, idx: number) => (
                                    <a
                                      key={idx}
                                      href={file.fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                                    >
                                      <FileText
                                        size={16}
                                        className="flex-shrink-0"
                                      />
                                      <span className="truncate">
                                        {file.fileName}
                                      </span>
                                    </a>
                                  ),
                                )}
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "activity" && (
            <div className="space-y-3">
              {activityLogs.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>No activity yet</p>
                </div>
              ) : (
                activityLogs.map((log) => (
                  <div
                    key={log._id}
                    className="flex gap-3 items-start bg-gray-50 p-4 rounded-xl"
                  >
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                      {log.user && log.user.name
                        ? getInitials(log.user.name)
                        : "??"}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700">{log.description}</p>
                      <span className="text-xs text-gray-500">
                        {log.timestamp
                          ? formatRelativeTime(log.timestamp)
                          : log.createdAt
                            ? formatRelativeTime(log.createdAt)
                            : "No date"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {isEditing && (
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancel}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}