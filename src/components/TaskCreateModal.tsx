"use client";

import React, { useState } from "react";
import {
  X,
  Calendar,
  Flag,
  Users,
  FileText,
  Clock,
  Layers,
  Link2,
  AlertCircle,
  ChevronDown,
  Plus,
  Trash2,
} from "lucide-react";
import { Task } from "@/types/task.types";

interface TeamMember {
  _id: string;
  userId: { _id: string; name: string; email: string };
  status: string;
}
interface Assignee {
  email: string;
  name: string;
}
interface Phase {
  _id: string;
  name: string;
  description?: string;
  order: number;
  color?: string;
  projectId: string;
}
interface FormData {
  title: string;
  description: string;
  status: string;
  priority: string;
  taskType: "Task" | "Deliverable" | "Milestone";
  assignees: Assignee[];
  startDate: string;
  dueDate: string;
  progress: number;
  duration: number;
  phaseId: string | null;
  dependencies: { taskId: string; type: "FS" | "SS" }[];
}
interface TaskCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  selectedAssignees: Assignee[];
  setSelectedAssignees: React.Dispatch<React.SetStateAction<Assignee[]>>;
  teamMembers: TeamMember[];
  phases: Phase[];
  tasks: Task[];
  onSubmit: () => void;
  saving: boolean;
  checkMemberHasActiveTask: (email: string) => boolean;
}

const AVATAR_COLORS = [
  "bg-violet-500", "bg-sky-500", "bg-emerald-500",
  "bg-rose-500", "bg-amber-500", "bg-indigo-500",
];

const priorityConfig = {
  Low:      { dot: "bg-emerald-400", label: "Low",      ring: "ring-emerald-200" },
  Medium:   { dot: "bg-amber-400",   label: "Medium",   ring: "ring-amber-200" },
  High:     { dot: "bg-orange-400",  label: "High",     ring: "ring-orange-200" },
  Critical: { dot: "bg-rose-500",    label: "Critical", ring: "ring-rose-200" },
};

const statusConfig = {
  Backlog:     { color: "text-slate-500",   bg: "bg-slate-100"  },
  "In Progress":{ color: "text-sky-600",    bg: "bg-sky-50"     },
  Blocked:     { color: "text-rose-600",    bg: "bg-rose-50"    },
  Done:        { color: "text-emerald-600", bg: "bg-emerald-50" },
};

function SectionLabel({ icon: Icon, children, required }: {
  icon: React.ElementType; children: React.ReactNode; required?: boolean;
}) {
  return (
    <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
      <Icon size={12} />
      {children}
      {required && <span className="text-rose-400 normal-case tracking-normal text-sm ml-0.5">*</span>}
    </label>
  );
}

function Field({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`space-y-1.5 ${className}`}>{children}</div>;
}

export default function TaskCreateModal({
  isOpen, onClose, formData, setFormData,
  selectedAssignees, setSelectedAssignees,
  teamMembers, phases, tasks, onSubmit, saving,
}: TaskCreateModalProps) {
  const [depsOpen, setDepsOpen] = useState(false);

  if (!isOpen) return null;

  const handleAddAssignee = (email: string) => {
    if (!email) return;
    const m = teamMembers.find((m) => m.userId.email === email);
    if (!m) return;
    if (selectedAssignees.some((a) => a.email === m.userId.email)) return;
    const updated = [...selectedAssignees, { email: m.userId.email, name: m.userId.name }];
    setSelectedAssignees(updated);
    setFormData({ ...formData, assignees: updated });
  };

  const handleRemoveAssignee = (index: number) => {
    const updated = selectedAssignees.filter((_, i) => i !== index);
    setSelectedAssignees(updated);
    setFormData({ ...formData, assignees: updated });
  };

  const handleAddDep = () =>
    setFormData({ ...formData, dependencies: [...formData.dependencies, { taskId: "", type: "FS" }] });

  const handleRemoveDep = (i: number) =>
    setFormData({ ...formData, dependencies: formData.dependencies.filter((_, idx) => idx !== i) });

  const handleDepChange = (i: number, field: "taskId" | "type", val: string) => {
    const updated = [...formData.dependencies];
    if (field === "taskId") updated[i].taskId = val;
    else updated[i].type = val as "FS" | "SS";
    setFormData({ ...formData, dependencies: updated });
  };

  const getAvailableTasks = (idx: number) => {
    const taken = formData.dependencies.filter((_, i) => i !== idx).map((d) => d.taskId);
    return tasks.filter((t) => !taken.includes(t._id));
  };

  const inputBase =
    "w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 " +
    "placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 " +
    "transition-all duration-150";

  const selectBase = inputBase + " appearance-none cursor-pointer";

  const canSubmit = !saving && formData.title.trim() && formData.assignees.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 lg:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={
          "relative bg-white w-full sm:max-w-2xl lg:max-w-3xl xl:max-w-4xl " +
          "rounded-t-3xl sm:rounded-2xl shadow-2xl shadow-slate-900/20 " +
          "flex flex-col max-h-[94dvh] sm:max-h-[90vh] overflow-hidden " +
          "ring-1 ring-slate-900/5"
        }
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 sm:px-7 pt-4 sm:pt-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Create Task
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              Fill in the details below to add a new task
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Scrollable Body ── */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-5 sm:py-6 space-y-6">

          {/* Title */}
          <Field>
            <SectionLabel icon={FileText} required>Task Title</SectionLabel>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Design homepage wireframes"
              className={inputBase + " text-base font-medium"}
            />
          </Field>

          {/* Description */}
          <Field>
            <SectionLabel icon={FileText}>Description</SectionLabel>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add context, requirements, or notes…"
              rows={3}
              className={inputBase + " resize-none leading-relaxed"}
            />
          </Field>

          {/* Status / Priority / Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field>
              <SectionLabel icon={Flag} required>Status</SectionLabel>
              <div className="relative">
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className={selectBase}
                >
                  <option value="" disabled>Select…</option>
                  <option value="Backlog">Backlog</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Blocked">Blocked</option>
                  <option value="Done">Done</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </Field>

            <Field>
              <SectionLabel icon={Flag} required>Priority</SectionLabel>
              <div className="relative">
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className={selectBase}
                >
                  <option value="" disabled>Select…</option>
                  {Object.keys(priorityConfig).map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </Field>

            <Field>
              <SectionLabel icon={Layers} required>Type</SectionLabel>
              <div className="relative">
                <select
                  value={formData.taskType}
                  onChange={(e) => {
                    const t = e.target.value as "Task" | "Deliverable" | "Milestone";
                    setFormData({ ...formData, taskType: t, duration: t === "Milestone" ? 1 : formData.duration });
                  }}
                  className={selectBase}
                >
                  <option value="Task">Task</option>
                  <option value="Deliverable">Deliverable</option>
                  <option value="Milestone">Milestone</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </Field>
          </div>

          {/* Phase / Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field>
              <SectionLabel icon={Layers}>Phase</SectionLabel>
              <div className="relative">
                <select
                  value={formData.phaseId || ""}
                  onChange={(e) => setFormData({ ...formData, phaseId: e.target.value || null })}
                  className={selectBase}
                >
                  <option value="">No Phase</option>
                  {phases.sort((a, b) => a.order - b.order).map((p) => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </Field>

            <Field>
              <SectionLabel icon={Clock} required>Duration (working days)</SectionLabel>
              <input
                type="number"
                min="0"
                max={formData.taskType === "Milestone" ? 1 : undefined}
                value={formData.duration}
                onChange={(e) => {
                  const v = parseInt(e.target.value) || 0;
                  setFormData({ ...formData, duration: formData.taskType === "Milestone" ? Math.min(v, 1) : v });
                }}
                className={inputBase}
              />
              {formData.taskType === "Milestone" && (
                <p className="flex items-center gap-1 text-xs text-amber-600">
                  <AlertCircle size={11} /> Milestones are capped at 1 day
                </p>
              )}
            </Field>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field>
              <SectionLabel icon={Calendar}>Start Date</SectionLabel>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className={inputBase}
              />
              <p className="text-xs text-slate-400">Auto-calculated from dependencies</p>
            </Field>

            <Field>
              <SectionLabel icon={Calendar}>Due Date</SectionLabel>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className={inputBase}
              />
              <p className="text-xs text-slate-400">Auto-calculated from start + duration</p>
            </Field>
          </div>

          {/* Assignees */}
          <Field>
            <SectionLabel icon={Users} required>Assignees</SectionLabel>
            <div className="relative">
              <select
                onChange={(e) => { handleAddAssignee(e.target.value); e.currentTarget.value = ""; }}
                className={selectBase}
              >
                <option value="">Add a team member…</option>
                {teamMembers
                  .filter((m) => m.status === "active")
                  .map((m) => (
                    <option key={m._id} value={m.userId.email}>{m.userId.name}</option>
                  ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {selectedAssignees.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedAssignees.map((a, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 bg-slate-50 border border-slate-200 pl-1.5 pr-2.5 py-1.5 rounded-full"
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}
                    >
                      {a.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                    </div>
                    <span className="text-xs font-semibold text-slate-700">{a.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAssignee(i)}
                      className="text-slate-300 hover:text-rose-500 transition-colors ml-0.5"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Field>

          {/* Progress */}
          <Field>
            <div className="flex items-center justify-between mb-2">
              <SectionLabel icon={Clock}>Progress</SectionLabel>
              <span className="text-xs font-bold text-slate-700 tabular-nums">{formData.progress}%</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-slate-700 to-slate-900 rounded-full transition-all duration-200"
                    style={{ width: `${formData.progress}%` }}
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer h-2"
                />
              </div>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.progress}
                onChange={(e) => setFormData({ ...formData, progress: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })}
                className="w-16 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-center font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </div>
          </Field>

          {/* Dependencies (collapsible) */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setDepsOpen(!depsOpen)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Link2 size={13} className="text-slate-500" />
                <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Dependencies
                </span>
                {formData.dependencies.length > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 bg-slate-800 text-white text-[10px] font-bold rounded-full">
                    {formData.dependencies.length}
                  </span>
                )}
              </div>
              <ChevronDown
                size={14}
                className={`text-slate-400 transition-transform duration-200 ${depsOpen ? "rotate-180" : ""}`}
              />
            </button>

            {depsOpen && (
              <div className="p-4 space-y-3 border-t border-slate-100">
                {formData.dependencies.map((dep, i) => (
                  <div key={i} className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <select
                        value={dep.taskId}
                        onChange={(e) => handleDepChange(i, "taskId", e.target.value)}
                        className={selectBase + " text-xs"}
                      >
                        <option value="">Select a task…</option>
                        {getAvailableTasks(i).map((t) => (
                          <option key={t._id} value={t._id}>{t.title}</option>
                        ))}
                      </select>
                      <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                    <div className="relative sm:w-40">
                      <select
                        value={dep.type}
                        onChange={(e) => handleDepChange(i, "type", e.target.value)}
                        className={selectBase + " text-xs"}
                      >
                        <option value="FS">Finish → Start</option>
                        <option value="SS">Start → Start</option>
                      </select>
                      <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveDep(i)}
                      className="self-end sm:self-auto p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddDep}
                  className="w-full py-2 border border-dashed border-slate-300 text-slate-400 hover:border-slate-500 hover:text-slate-600 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                >
                  <Plus size={13} /> Add dependency
                </button>

                <p className="text-xs text-slate-400 pt-1">
                  Dependencies control when this task can start relative to others.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="border-t border-slate-100 px-5 sm:px-7 py-4 bg-white">
          <div className="flex flex-col-reverse sm:flex-row gap-2.5">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none sm:w-28 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              disabled={!canSubmit}
              className="flex-1 sm:flex-[2] px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold
                         hover:bg-slate-800 active:bg-slate-950 transition-all
                         disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating…
                </>
              ) : (
                "Create Task"
              )}
            </button>
          </div>

          {/* Validation hint */}
          {(!formData.title.trim() || formData.assignees.length === 0) && (
            <p className="text-xs text-slate-400 mt-2 text-center">
              {!formData.title.trim() ? "Task title is required" : "At least one assignee is required"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}