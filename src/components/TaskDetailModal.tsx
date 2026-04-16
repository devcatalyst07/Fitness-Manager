"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Task,
  Comment,
  ActivityLog,
  Phase,
  TeamMember,
} from "@/types/task.types";
import {
  getPriorityBadge,
  getStatusBadge,
  formatDate,
  getInitials,
} from "@/utils/taskHelpers";

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
  activeTab: "details" | "comments" | "activity";
  setActiveTab: (tab: "details" | "comments" | "activity") => void;
  comments: Comment[];
  activityLogs: ActivityLog[];
  newComment: string;
  setNewComment: (comment: string) => void;
  onAddComment: () => void;
  selectedFiles: File[];
  setSelectedFiles: (files: File[]) => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadingFiles: boolean;
  phases: Phase[];
  allTasks: Task[];
  onUpdateTask?: (taskId: string, data: Partial<Task>) => Promise<void>;
  teamMembers?: TeamMember[];
  onFileSelect?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile?: (index: number) => void;
  canEdit?: boolean;
  onUpdateDependentTask?: (taskId: string, updates: Partial<Task>) => Promise<void>;
}

// ─── Working-day helpers ──────────────────────────────────────────────────────

function addWorkingDays(startDateStr: string, days: number): string {
  if (!startDateStr || !days || days <= 0) return startDateStr ?? "";
  const date = new Date(startDateStr + "T00:00:00");
  if (isNaN(date.getTime())) return startDateStr;
  let added = 0;
  const target = Math.max(days - 1, 0);
  while (added < target) {
    date.setDate(date.getDate() + 1);
    const dow = date.getDay();
    if (dow !== 0 && dow !== 6) added++;
  }
  return date.toISOString().split("T")[0];
}

function addOneDayStr(dateStr: string): string {
  if (!dateStr) return dateStr;
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return dateStr;
  d.setDate(d.getDate() + 1);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

// ─── TeamMember helpers ───────────────────────────────────────────────────────

function getMemberName(member: TeamMember): string {
  return member.userId?.name ?? (member as any).name ?? "";
}
function getMemberEmail(member: TeamMember): string {
  return member.userId?.email ?? (member as any).email ?? "";
}
function getMemberId(member: TeamMember): string {
  return member.userId?._id ?? member._id ?? "";
}

function normaliseMembers(members: TeamMember[]): TeamMember[] {
  return members.map((m) => {
    if (m.userId && typeof m.userId === "object" && m.userId.name) return m;
    const flat = m as any;
    if (!m.userId && flat.name && flat.email) {
      return {
        ...m,
        userId: { _id: flat._id ?? "", name: flat.name, email: flat.email },
      } as TeamMember;
    }
    return m;
  });
}

// ─── Editable Text ───────────────────────────────────────────────────────────

function EditableText({
  value,
  onSave,
  placeholder = "Click to edit...",
  className = "",
}: {
  value: string;
  onSave: (val: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft.trim() !== value) onSave(draft.trim());
  };

  return editing ? (
    <input
      ref={inputRef}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") { setDraft(value); setEditing(false); }
      }}
      className={`w-full px-3 py-2 border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white ${className}`}
    />
  ) : (
    <p
      onClick={() => setEditing(true)}
      title="Click to edit"
      className={`cursor-pointer rounded-lg px-3 py-2 text-sm text-gray-900 hover:bg-blue-50 hover:ring-1 hover:ring-blue-200 transition-all min-h-[36px] ${
        !value ? "text-gray-400 italic" : ""
      } ${className}`}
    >
      {value || placeholder}
    </p>
  );
}

// ─── Editable Textarea ───────────────────────────────────────────────────────

function EditableTextarea({
  value,
  onSave,
  placeholder = "Click to add a description...",
}: {
  value: string;
  onSave: (val: string) => void;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft !== value) onSave(draft);
  };

  return editing ? (
    <textarea
      ref={ref}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Escape") { setDraft(value); setEditing(false); }
      }}
      rows={4}
      className="w-full px-3 py-2 border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white resize-none"
    />
  ) : (
    <p
      onClick={() => setEditing(true)}
      title="Click to edit"
      className={`cursor-pointer rounded-lg px-3 py-2 text-sm hover:bg-blue-50 hover:ring-1 hover:ring-blue-200 transition-all min-h-[72px] whitespace-pre-wrap ${
        !value ? "text-gray-400 italic" : "text-gray-700"
      }`}
    >
      {value || placeholder}
    </p>
  );
}

// ─── Editable Select ─────────────────────────────────────────────────────────

function EditableSelect<T extends string>({
  value,
  options,
  onSave,
  renderValue,
}: {
  value: T;
  options: { label: string; value: T }[];
  onSave: (val: T) => void;
  renderValue?: (val: T) => React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLSelectElement>(null);

  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);

  const commit = (val: T) => {
    setEditing(false);
    if (val !== value) onSave(val);
  };

  return editing ? (
    <select
      ref={ref}
      defaultValue={value}
      onBlur={(e) => commit(e.target.value as T)}
      onChange={(e) => commit(e.target.value as T)}
      className="w-full px-3 py-2 border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
      autoFocus
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  ) : (
    <div
      onClick={() => setEditing(true)}
      title="Click to edit"
      className="cursor-pointer rounded-lg px-3 py-2 hover:bg-blue-50 hover:ring-1 hover:ring-blue-200 transition-all inline-flex items-center"
    >
      {renderValue ? renderValue(value) : (
        <span className="text-sm text-gray-900">{value}</span>
      )}
    </div>
  );
}

// ─── Editable Number ─────────────────────────────────────────────────────────

function EditableNumber({
  value,
  onSave,
  min = 0,
  max,
  suffix = "",
}: {
  value: number;
  onSave: (val: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { setDraft(String(value)); }, [value]);
  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);

  const commit = () => {
    setEditing(false);
    const parsed = parseInt(draft) || min;
    const clamped =
      max !== undefined
        ? Math.min(Math.max(parsed, min), max)
        : Math.max(parsed, min);
    if (clamped !== value) onSave(clamped);
  };

  return editing ? (
    <input
      ref={ref}
      type="number"
      value={draft}
      min={min}
      max={max}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") { setDraft(String(value)); setEditing(false); }
      }}
      className="w-full px-3 py-2 border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
    />
  ) : (
    <p
      onClick={() => setEditing(true)}
      title="Click to edit"
      className="cursor-pointer rounded-lg px-3 py-2 text-sm text-gray-900 hover:bg-blue-50 hover:ring-1 hover:ring-blue-200 transition-all"
    >
      {value}{suffix}
    </p>
  );
}

// ─── Editable Date ───────────────────────────────────────────────────────────

function EditableDate({
  value,
  onSave,
  placeholder = "Set date",
}: {
  value: string;
  onSave: (val: string) => void;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) ref.current?.showPicker?.();
  }, [editing]);

  const commit = (val: string) => {
    setEditing(false);
    if (val !== value) onSave(val);
  };

  return editing ? (
    <input
      ref={ref}
      type="date"
      defaultValue={value}
      onChange={(e) => commit(e.target.value)}
      onBlur={() => setEditing(false)}
      className="w-full px-3 py-2 border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
      autoFocus
    />
  ) : (
    <p
      onClick={() => setEditing(true)}
      title="Click to edit"
      className={`cursor-pointer rounded-lg px-3 py-2 text-sm hover:bg-blue-50 hover:ring-1 hover:ring-blue-200 transition-all ${
        value ? "text-gray-900" : "text-gray-400 italic"
      }`}
    >
      {value ? formatDate(value) : placeholder}
    </p>
  );
}

// ─── Editable Progress ───────────────────────────────────────────────────────

function EditableProgress({
  value,
  onSave,
}: {
  value: number;
  onSave: (val: number) => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => { setDraft(value); }, [value]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-blue-500 h-full rounded-full transition-all duration-200"
            style={{ width: `${draft}%` }}
          />
        </div>
        <span className="text-sm font-medium text-gray-700 w-10 text-right">{draft}%</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={draft}
        onChange={(e) => setDraft(parseInt(e.target.value))}
        onMouseUp={() => { if (draft !== value) onSave(draft); }}
        onTouchEnd={() => { if (draft !== value) onSave(draft); }}
        className="w-full h-1.5 accent-blue-600 cursor-pointer"
      />
    </div>
  );
}

// ─── Editable Assignees ──────────────────────────────────────────────────────

function EditableAssignees({
  assignees,
  teamMembers = [],
  onSave,
  canEdit,
}: {
  assignees: Array<{ email: string; name: string }>;
  teamMembers: TeamMember[];
  onSave: (assignees: Array<{ email: string; name: string }>) => void;
  canEdit: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Array<{ email: string; name: string }>>(() => [...assignees]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelected([...assignees]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignees.map(a => a.email).join(",")]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const eligibleMembers = useMemo(() => {
    return normaliseMembers(teamMembers).filter((m) => {
      const email = getMemberEmail(m);
      return email && email.includes("@");
    });
  }, [teamMembers]);

  const isSelected = useCallback(
    (member: TeamMember) => selected.some((a) => a.email === getMemberEmail(member)),
    [selected],
  );

  const toggle = (member: TeamMember) => {
    const email = getMemberEmail(member);
    const name = getMemberName(member);
    const next = isSelected(member)
      ? selected.filter((a) => a.email !== email)
      : [...selected, { email, name }];
    setSelected(next);
    onSave(next);
  };

  const removeAssignee = (assignee: { email: string; name: string }, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = selected.filter((a) => a.email !== assignee.email);
    setSelected(next);
    onSave(next);
  };

  return (
    <div ref={containerRef} className="px-3 py-2 relative">
      <div
        onClick={() => canEdit && setOpen((o) => !o)}
        title={canEdit ? "Click to assign team members" : undefined}
        className={`flex flex-wrap gap-2 min-h-[36px] rounded-lg transition-all ${
          canEdit ? "cursor-pointer p-1 hover:bg-blue-50 hover:ring-1 hover:ring-blue-200" : ""
        }`}
      >
        {selected.length > 0 ? (
          selected.map((assignee, i) => (
            <div
              key={assignee.email || i}
              className="flex items-center gap-2 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg"
            >
              <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-[10px] font-semibold">
                {getInitials(assignee.name)}
              </div>
              <span className="text-sm text-gray-800">{assignee.name || assignee.email}</span>
              {canEdit && (
                <button
                  onClick={(e) => removeAssignee(assignee, e)}
                  className="ml-0.5 text-blue-300 hover:text-red-500 transition-colors text-base leading-none"
                >
                  ×
                </button>
              )}
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-400 italic py-1">
            {canEdit ? "Click to assign team members" : "No assignees"}
          </p>
        )}
      </div>

      {open && canEdit && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-20 py-1.5 max-h-52 overflow-y-auto">
          {eligibleMembers.length === 0 ? (
            <p className="text-xs text-gray-400 px-4 py-3 italic">
              No team members available
            </p>
          ) : (
            eligibleMembers.map((member) => {
              const checked = isSelected(member);
              const name = getMemberName(member);
              const email = getMemberEmail(member);
              const id = getMemberId(member);
              return (
                <div
                  key={id || email}
                  onClick={(e) => { e.stopPropagation(); toggle(member); }}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  <div
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                      checked ? "bg-blue-600 border-blue-600" : "border-gray-300"
                    }`}
                  >
                    {checked && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-[10px] font-semibold shrink-0">
                    {getInitials(name || email)}
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm text-gray-800 truncate block">{name || email}</span>
                    {name && <span className="text-[10px] text-gray-400 truncate block">{email}</span>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ─── Badge helpers ───────────────────────────────────────────────────────────

const getTaskTypeBadge = (taskType: string) => {
  const badges: Record<string, string> = {
    Task: "bg-blue-50 text-blue-800 border-blue-200",
    Deliverable: "bg-purple-50 text-purple-800 border-purple-200",
    Milestone: "bg-emerald-50 text-emerald-800 border-emerald-200",
  };
  return badges[taskType] || "bg-gray-50 text-gray-700 border-gray-200";
};

const getDependencyTypeLabel = (type: string) =>
  type === "FS" ? "Finish to Start" : "Start to Start";

// ─── Field wrapper ───────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 px-1">
        {label}
      </p>
      {children}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function TaskDetailModal({
  isOpen,
  onClose,
  task,
  onUpdate,
  onDelete,
  activeTab,
  setActiveTab,
  comments,
  activityLogs,
  newComment,
  setNewComment,
  onAddComment,
  selectedFiles,
  setSelectedFiles,
  handleFileSelect,
  uploadingFiles,
  phases,
  allTasks,
  onUpdateTask,
  teamMembers = [],
  onFileSelect,
  onRemoveFile,
  canEdit = true,
  onUpdateDependentTask,
}: TaskDetailModalProps) {
  type Dep = { taskId: string; type: "FS" | "SS" };

  // ── Local state ──────────────────────────────────────────────────────────────
  const [localDeps, setLocalDeps] = useState<Dep[]>([]);
  const [pendingDepIndexes, setPendingDepIndexes] = useState<Set<number>>(new Set());
  const [localDuration, setLocalDuration] = useState<number>(task?.duration ?? 1);
  const [localStartDate, setLocalStartDate] = useState<string>(task?.startDate ?? "");
  const [localDueDate, setLocalDueDate] = useState<string>(task?.dueDate ?? "");

  const savingRef = useRef(false);

  // Sync all local state when the task itself changes
  useEffect(() => {
    setLocalDeps(task?.dependencies ?? []);
    setPendingDepIndexes(new Set());
    setLocalDuration(task?.duration ?? 1);
    setLocalStartDate(task?.startDate ?? "");
    setLocalDueDate(task?.dueDate ?? "");
  }, [task?._id]);

  // Sync individual fields when the server pushes an update
  useEffect(() => { if (task?.duration !== undefined) setLocalDuration(task.duration); }, [task?.duration]);
  useEffect(() => { if (task?.startDate !== undefined) setLocalStartDate(task.startDate ?? ""); }, [task?.startDate]);
  useEffect(() => { if (task?.dueDate !== undefined) setLocalDueDate(task.dueDate ?? ""); }, [task?.dueDate]);
  useEffect(() => { if (task?.dependencies) setLocalDeps(task.dependencies); }, [task?.dependencies]);

  // ── Silent save helper ───────────────────────────────────────────────────────
  const save = useCallback(async (updates: Partial<Task>) => {
    if (!task?._id) return;

    if (updates.dependencies) {
      updates = {
        ...updates,
        dependencies: updates.dependencies.filter(
          (d) => d.taskId && d.taskId.trim() !== "",
        ),
      };
    }

    try {
      if (onUpdateTask) {
        await onUpdateTask(task._id, updates);
      } else {
        await (onUpdate as any)(task._id, updates);
      }
    } catch (err) {
      console.error("[TaskDetailModal] save failed (silent):", err);
    }
  }, [task?._id, onUpdateTask, onUpdate]);

  // ── Dependency cascade propagation ──────────────────────────────────────────
  const propagateDueDateChange = useCallback(async (
    changedTaskId: string,
    newDueDate: string,
    visited: Set<string> = new Set(),
  ) => {
    if (visited.has(changedTaskId)) return;
    visited.add(changedTaskId);

    const dependentTasks = allTasks.filter((t) =>
      t._id !== changedTaskId &&
      t.dependencies?.some((d) => d.taskId === changedTaskId),
    );

    for (const depTask of dependentTasks) {
      const depRel = depTask.dependencies?.find((d) => d.taskId === changedTaskId);
      if (!depRel) continue;

      let newDepStart: string;
      if (depRel.type === "FS") {
        newDepStart = addOneDayStr(newDueDate);
      } else {
        newDepStart = depTask.startDate || addOneDayStr(newDueDate);
      }

      const duration = Math.max(depTask.duration ?? 1, 1);
      const newDepDue = addWorkingDays(newDepStart, duration);

      if (newDepStart === depTask.startDate && newDepDue === depTask.dueDate) continue;

      const depUpdates: Partial<Task> = {
        startDate: newDepStart,
        dueDate: newDepDue,
      };

      try {
        if (onUpdateDependentTask) {
          await onUpdateDependentTask(depTask._id, depUpdates);
        } else if (onUpdateTask) {
          await onUpdateTask(depTask._id, depUpdates);
        } else {
          await (onUpdate as any)(depTask._id, depUpdates);
        }
      } catch (err) {
        console.error("[TaskDetailModal] dependent task save failed (silent):", err);
      }

      await propagateDueDateChange(depTask._id, newDepDue, visited);
    }
  }, [allTasks, onUpdateDependentTask, onUpdateTask, onUpdate]);

  // ── Duration change ──────────────────────────────────────────────────────────
  const handleDurationChange = useCallback((newDuration: number) => {
    const safeDuration = Math.max(1, newDuration);
    const startDate = localStartDate || task?.startDate || "";
    const newDueDate = startDate ? addWorkingDays(startDate, safeDuration) : localDueDate;

    setLocalDuration(safeDuration);
    if (newDueDate) setLocalDueDate(newDueDate);

    const updates: Partial<Task> = { duration: safeDuration };
    if (newDueDate) updates.dueDate = newDueDate;
    save(updates).then(() => {
      if (newDueDate && task?._id) propagateDueDateChange(task._id, newDueDate);
    });
  }, [localStartDate, localDueDate, task, save, propagateDueDateChange]);

  // ── Start date change ────────────────────────────────────────────────────────
  const handleStartDateChange = useCallback((newStartDate: string) => {
    if (!newStartDate) return;
    const duration = Math.max(1, localDuration ?? task?.duration ?? 1);
    const newDueDate = addWorkingDays(newStartDate, duration);

    setLocalStartDate(newStartDate);
    if (newDueDate) setLocalDueDate(newDueDate);

    const updates: Partial<Task> = { startDate: newStartDate };
    if (newDueDate) updates.dueDate = newDueDate;
    save(updates).then(() => {
      if (newDueDate && task?._id) propagateDueDateChange(task._id, newDueDate);
    });
  }, [localDuration, task, save, propagateDueDateChange]);

  // ── EARLY RETURN — must come after ALL hooks ─────────────────────────────────
  if (!isOpen || !task) return null;

  const fileSelectHandler = onFileSelect || handleFileSelect;

  // ── Dependency helpers ───────────────────────────────────────────────────────

  const getAvailableTasks = (excludeTaskIds: string[]) =>
    allTasks.filter((t) => t._id !== task._id && !excludeTaskIds.includes(t._id));

  const addDependency = () => {
    const newIndex = localDeps.length;
    const updated: Dep[] = [...localDeps, { taskId: "", type: "FS" }];
    setLocalDeps(updated);
    setPendingDepIndexes((prev) => new Set(prev).add(newIndex));
  };

  const updateDep = (index: number, field: keyof Dep, val: string) => {
    const updated = localDeps.map((d, i) =>
      i === index ? { ...d, [field]: val } : d
    ) as Dep[];
    setLocalDeps(updated);

    if (field === "taskId") {
      if (!val) {
        setPendingDepIndexes((prev) => new Set(prev).add(index));
        return;
      }
      setPendingDepIndexes((prev) => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }

    const currentPending = new Set(pendingDepIndexes);
    if (field === "taskId") {
      if (val) currentPending.delete(index);
      else currentPending.add(index);
    }

    const readyDeps = updated.filter((d, i) => d.taskId && !currentPending.has(i));
    save({ dependencies: readyDeps });
  };

  const removeDep = (index: number) => {
    const updated = localDeps.filter((_, i) => i !== index);
    setLocalDeps(updated);
    setPendingDepIndexes((prev) => {
      const next = new Set<number>();
      prev.forEach((i) => {
        if (i < index) next.add(i);
        else if (i > index) next.add(i - 1);
      });
      return next;
    });
    const readyDeps = updated.filter((d) => d.taskId);
    save({ dependencies: readyDeps });
  };

  const handleDelete = () => {
    onDelete(task._id);
    onClose();
  };

  const TABS = [
    { id: "details" as const, label: "Details" },
    { id: "comments" as const, label: `Comments (${comments.length})` },
    { id: "activity" as const, label: "Activity" },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-6"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100 gap-4">
          <div className="flex-1 min-w-0">
            {canEdit ? (
              <EditableText
                value={task.title}
                onSave={(val) => save({ title: val })}
                className="text-lg font-semibold !px-2 !py-1"
              />
            ) : (
              <h2 className="text-lg font-semibold text-gray-900 px-2">{task.title}</h2>
            )}
            <div className="flex items-center gap-2 mt-1 px-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${getTaskTypeBadge(task.taskType || "Task")}`}>
                {task.taskType || "Task"}
              </span>
              {localDuration > 0 && (
                <span className="text-xs text-gray-400">
                  {localDuration} working day{localDuration !== 1 ? "s" : ""}
                </span>
              )}
              {canEdit && (
                <span className="text-[10px] text-gray-300 ml-1">· click any field to edit</span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-all shrink-0"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Tabs ── */}
        <div className="flex border-b border-gray-100 px-4 bg-white overflow-x-auto shrink-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${
                activeTab === tab.id
                  ? "text-blue-600 border-blue-500"
                  : "text-gray-500 border-transparent hover:text-gray-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Scrollable Body ── */}
        <div className="flex-1 overflow-y-auto">

          {/* ════ Details Tab ════ */}
          {activeTab === "details" && (
            <div className="p-6 space-y-6">

              {/* Description */}
              <Field label="Description">
                {canEdit ? (
                  <EditableTextarea
                    value={task.description || ""}
                    onSave={(val) => save({ description: val })}
                  />
                ) : (
                  <p className="text-sm text-gray-700 px-3 py-2">
                    {task.description || <span className="text-gray-400 italic">No description</span>}
                  </p>
                )}
              </Field>

              {/* Status / Priority / Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <Field label="Status">
                  <EditableSelect
                    value={task.status as any}
                    options={[
                      { label: "Backlog", value: "Backlog" },
                      { label: "In Progress", value: "In Progress" },
                      { label: "Blocked", value: "Blocked" },
                      { label: "Done", value: "Done" },
                    ]}
                    onSave={(val) => save({ status: val as any })}
                    renderValue={(val) => (
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadge(val)}`}>
                        {val}
                      </span>
                    )}
                  />
                </Field>

                <Field label="Priority">
                  <EditableSelect
                    value={task.priority as any}
                    options={[
                      { label: "Low", value: "Low" },
                      { label: "Medium", value: "Medium" },
                      { label: "High", value: "High" },
                      { label: "Critical", value: "Critical" },
                    ]}
                    onSave={(val) => save({ priority: val as any })}
                    renderValue={(val) => (
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getPriorityBadge(val)}`}>
                        {val}
                      </span>
                    )}
                  />
                </Field>

                <Field label="Task type">
                  <EditableSelect
                    value={(task.taskType || "Task") as any}
                    options={[
                      { label: "Task", value: "Task" },
                      { label: "Deliverable", value: "Deliverable" },
                      { label: "Milestone", value: "Milestone" },
                    ]}
                    onSave={(val) => {
                      const isMilestone = val === "Milestone";
                      const newDuration = isMilestone ? 1 : (localDuration ?? 1);
                      const updates: Partial<Task> = { taskType: val as any, duration: newDuration };
                      if (localStartDate) {
                        const newDueDate = addWorkingDays(localStartDate, newDuration);
                        if (newDueDate) {
                          updates.dueDate = newDueDate;
                          setLocalDueDate(newDueDate);
                        }
                      }
                      setLocalDuration(newDuration);
                      save(updates);
                    }}
                    renderValue={(val) => (
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getTaskTypeBadge(val)}`}>
                        {val}
                      </span>
                    )}
                  />
                </Field>
              </div>

              {/* Phase / Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Field label="Phase">
                  <EditableSelect
                    value={task.phaseId || ""}
                    options={[
                      { label: "No Phase (Unassigned)", value: "" },
                      ...phases
                        .sort((a, b) => a.order - b.order)
                        .map((p) => ({ label: p.name, value: p._id })),
                    ]}
                    onSave={(val) => save({ phaseId: val || null })}
                    renderValue={(val) => (
                      <span className="text-sm text-gray-900">
                        {val
                          ? phases.find((p) => p._id === val)?.name || "Unknown Phase"
                          : <span className="text-gray-400 italic">No phase</span>}
                      </span>
                    )}
                  />
                </Field>

                <Field label="Duration (working days)">
                  {canEdit ? (
                    <>
                      <EditableNumber
                        value={localDuration}
                        min={1}
                        max={task.taskType === "Milestone" ? 1 : undefined}
                        suffix={` day${localDuration !== 1 ? "s" : ""}`}
                        onSave={handleDurationChange}
                      />
                      {task.taskType === "Milestone" && (
                        <p className="text-[11px] text-gray-400 px-3">Milestones are capped at 1 day</p>
                      )}
                      {localStartDate && (
                        <p className="text-[11px] text-gray-400 px-3 mt-0.5">
                          Due date auto-updates from start date + duration
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-gray-900 px-3 py-2">
                      {localDuration} day{localDuration !== 1 ? "s" : ""}
                    </p>
                  )}
                </Field>
              </div>

              {/* Start Date / Due Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Field label="Start date">
                  {canEdit ? (
                    <EditableDate
                      value={localStartDate}
                      onSave={handleStartDateChange}
                      placeholder="Set start date"
                    />
                  ) : (
                    <p className="text-sm text-gray-900 px-3 py-2">{formatDate(localStartDate)}</p>
                  )}
                </Field>

                <Field label="Due date">
                  {canEdit ? (
                    <EditableDate
                      value={localDueDate}
                      onSave={(val) => {
                        setLocalDueDate(val);
                        save({ dueDate: val }).then(() => {
                          propagateDueDateChange(task._id, val);
                        });
                      }}
                      placeholder="Set due date"
                    />
                  ) : (
                    <p className="text-sm text-gray-900 px-3 py-2">{formatDate(localDueDate)}</p>
                  )}
                </Field>
              </div>

              {/* Progress */}
              <Field label={`Progress — ${task.progress ?? 0}%`}>
                <div className="px-3 py-2">
                  {canEdit ? (
                    <EditableProgress
                      value={task.progress ?? 0}
                      onSave={(val) => save({ progress: val })}
                    />
                  ) : (
                    <div className="bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full" style={{ width: `${task.progress ?? 0}%` }} />
                    </div>
                  )}
                </div>
              </Field>

              {/* Assigned to */}
              <Field label="Assigned to">
                <EditableAssignees
                  assignees={task.assignees || []}
                  teamMembers={teamMembers}
                  canEdit={canEdit}
                  onSave={(newAssignees) => save({ assignees: newAssignees as any })}
                />
              </Field>

              {/* Dependencies */}
              <Field label="Dependencies">
                <div className="px-3 py-2 space-y-2">
                  {canEdit && (
                    <button
                      onClick={addDependency}
                      className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      + Add dependency
                    </button>
                  )}

                  {localDeps.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">No dependencies</p>
                  ) : canEdit ? (
                    localDeps.map((dep, index) => {
                      const isPending = pendingDepIndexes.has(index);
                      const otherSelected = localDeps
                        .filter((_, i) => i !== index)
                        .map((d) => d.taskId)
                        .filter(Boolean);
                      const available = getAvailableTasks(otherSelected);

                      return (
                        <div
                          key={index}
                          className={`flex flex-col sm:flex-row gap-2 items-stretch sm:items-center rounded-lg p-2 ${
                            isPending ? "bg-amber-50 border border-amber-200" : "bg-gray-50"
                          }`}
                        >
                          <select
                            value={dep.taskId}
                            onChange={(e) => updateDep(index, "taskId", e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          >
                            <option value="">Select task…</option>
                            {available.map((t) => (
                              <option key={t._id} value={t._id}>{t.title}</option>
                            ))}
                          </select>
                          <select
                            value={dep.type}
                            onChange={(e) => updateDep(index, "type", e.target.value)}
                            className="w-full sm:w-36 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          >
                            <option value="FS">Finish to Start</option>
                            <option value="SS">Start to Start</option>
                          </select>
                          <button
                            onClick={() => removeDep(index)}
                            className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg text-xs transition-colors"
                          >
                            Remove
                          </button>
                          {isPending && (
                            <span className="text-[10px] text-amber-600 sm:hidden">
                              Select a task to save
                            </span>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    localDeps.map((dep, index) => {
                      const depTask = allTasks.find((t) => t._id === dep.taskId);
                      return (
                        <div key={index} className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-700">{depTask?.title || "Unknown task"}</span>
                          <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full">
                            {getDependencyTypeLabel(dep.type)}
                          </span>
                        </div>
                      );
                    })
                  )}

                  {canEdit && pendingDepIndexes.size > 0 && (
                    <p className="text-[11px] text-amber-600 hidden sm:block">
                      Select a task for each highlighted row to save the dependency.
                    </p>
                  )}
                </div>
              </Field>

              {/* Delete */}
              {canEdit && (
                <div className="pt-2 border-t border-gray-100">
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete task
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ════ Comments Tab ════ */}
          {activeTab === "comments" && (
            <div className="p-6 space-y-5">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment…"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm bg-white"
                />

                {selectedFiles.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-xs">
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        <span className="text-gray-700">{file.name}</span>
                        <button
                          onClick={() => {
                            if (onRemoveFile) {
                              onRemoveFile(index);
                            } else {
                              setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
                            }
                          }}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between mt-3 gap-2">
                  <label className="cursor-pointer text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1 transition-colors">
                    <input type="file" multiple onChange={fileSelectHandler} className="hidden" />
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    Attach files
                  </label>
                  <button
                    onClick={onAddComment}
                    disabled={uploadingFiles || (!newComment.trim() && selectedFiles.length === 0)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40 text-sm font-medium"
                  >
                    {uploadingFiles ? "Uploading…" : "Post"}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {comments.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 text-sm">No comments yet</div>
                ) : (
                  comments.map((comment) => {
                    const authorName = comment.userId?.name || (comment as any).userName || "Unknown User";
                    return (
                      <div key={comment._id} className="flex gap-3 p-4 bg-white border border-gray-100 rounded-xl">
                        <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0">
                          {getInitials(authorName)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-baseline gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-900">{authorName}</span>
                            <span className="text-xs text-gray-400">
                              {new Date(comment.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.comment}</p>
                          {comment.attachments && comment.attachments.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {comment.attachments.map((file, index) => {
                                const fileUrl = (file as any)?.url || (file as any)?.fileUrl;
                                const fileName = (file as any)?.name || (file as any)?.fileName || "Attachment";
                                if (!file || !fileUrl) return null;
                                return (
                                  <button
                                    key={index}
                                    onClick={() => window.open(fileUrl, "_blank")}
                                    className="text-xs px-2 py-1 bg-gray-100 text-blue-600 rounded hover:bg-gray-200 transition-colors"
                                  >
                                    {fileName}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ════ Activity Tab ════ */}
          {activeTab === "activity" && (
            <div className="p-6 space-y-3">
              {activityLogs.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">No activity yet</div>
              ) : (
                activityLogs.map((log) => {
                  const userName = log.user?.name || (log as any).userName || "Unknown User";
                  return (
                    <div key={log._id} className="flex gap-3 p-4 bg-gray-50 rounded-xl">
                      <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 text-xs font-semibold shrink-0">
                        {getInitials(userName)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">{userName}</span>{" "}
                          {log.description}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(log.timestamp || log.createdAt || Date.now()).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}