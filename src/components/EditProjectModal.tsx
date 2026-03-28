"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Loader2,
  Save,
  AlertCircle,
  FolderEdit,
} from "lucide-react";
import { apiClient } from "@/lib/axios";

interface Project {
  _id: string;
  projectName: string;
  brand: string;
  scope: string;
  workflow: string;
  status: string;
  budget: number;
  spent: number;
  description?: string;
  region?: string;
  projectCode?: string;
  startDate?: string;
  endDate?: string;
  calculatedStartDate?: string;
  calculatedEndDate?: string;
  isAtRisk?: boolean;
  riskReason?: string;
}

interface EditProjectModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedProject: Project) => void;
}

const STATUS_OPTIONS = [
  "Planning",
  "In Progress",
  "At Risk",
  "On Hold",
  "Completed",
  "Cancelled",
];

interface FormState {
  projectName: string;
  description: string;
  status: string;
  region: string;
  projectCode: string;
  budget: string;
  spent: string;
  startDate: string;
  endDate: string;
}

function toDateInputValue(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toISOString().split("T")[0];
  } catch {
    return "";
  }
}

export default function EditProjectModal({
  project,
  isOpen,
  onClose,
  onSuccess,
}: EditProjectModalProps) {
  const [form, setForm] = useState<FormState>({
    projectName: "",
    description: "",
    status: "Planning",
    region: "",
    projectCode: "",
    budget: "",
    spent: "",
    startDate: "",
    endDate: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Populate form when project changes
  useEffect(() => {
    if (project) {
      setForm({
        projectName: project.projectName || "",
        description: project.description || "",
        status: project.status || "Planning",
        region: project.region || "",
        projectCode: project.projectCode || "",
        budget: project.budget != null ? String(project.budget) : "",
        spent: project.spent != null ? String(project.spent) : "",
        startDate: toDateInputValue(
          project.calculatedStartDate || project.startDate,
        ),
        endDate: toDateInputValue(
          project.calculatedEndDate || project.endDate,
        ),
      });
      setError(null);
      setFieldErrors({});
    }
  }, [project]);

  // Focus first input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => firstInputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSaving) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, isSaving, onClose]);

  const set = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      if (fieldErrors[field]) {
        setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    };

  const validate = (): boolean => {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.projectName.trim()) errs.projectName = "Project name is required.";
    if (form.budget !== "" && isNaN(Number(form.budget)))
      errs.budget = "Must be a valid number.";
    if (form.spent !== "" && isNaN(Number(form.spent)))
      errs.spent = "Must be a valid number.";
    if (Number(form.spent) > Number(form.budget) && form.budget !== "")
      errs.spent = "Spent cannot exceed budget.";
    if (form.startDate && form.endDate && form.startDate > form.endDate)
      errs.endDate = "End date must be after start date.";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    if (!validate()) return;

    setIsSaving(true);
    setError(null);

    const payload: Record<string, any> = {
      projectName: form.projectName.trim(),
      description: form.description.trim(),
      status: form.status,
      region: form.region.trim(),
      projectCode: form.projectCode.trim(),
    };
    if (form.budget !== "") payload.budget = Number(form.budget);
    if (form.spent !== "") payload.spent = Number(form.spent);
    if (form.startDate) payload.startDate = form.startDate;
    if (form.endDate) payload.endDate = form.endDate;

    try {
      const res = await apiClient.put<{ project: Project }>(
        `/api/projects/${project._id}`,
        payload,
      );
      onSuccess(res.project);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !project) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => !isSaving && onClose()}
      />

      {/* Modal Panel */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <FolderEdit size={16} className="text-blue-600" />
            </div>
            <div>
              <h2
                id="edit-modal-title"
                className="text-base font-semibold text-gray-900"
              >
                Edit Project
              </h2>
              <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">
                {project.projectName}
              </p>
            </div>
          </div>
          <button
            onClick={() => !isSaving && onClose()}
            disabled={isSaving}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-5 space-y-5"
        >
          {/* Global error */}
          {error && (
            <div className="flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Read-only meta row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Brand
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 cursor-not-allowed">
                {project.brand}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Scope
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 cursor-not-allowed">
                {project.scope}
              </div>
            </div>
          </div>

          {/* Project Name */}
          <Field
            label="Project Name"
            required
            error={fieldErrors.projectName}
          >
            <input
              ref={firstInputRef}
              type="text"
              value={form.projectName}
              onChange={set("projectName")}
              placeholder="Enter project name"
              className={inputCls(!!fieldErrors.projectName)}
            />
          </Field>

          {/* Description */}
          <Field label="Description" error={fieldErrors.description}>
            <textarea
              value={form.description}
              onChange={set("description")}
              placeholder="Brief description of the project..."
              rows={3}
              className={`${inputCls(false)} resize-none`}
            />
          </Field>

          {/* Status + Project Code */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Status" error={fieldErrors.status}>
              <select
                value={form.status}
                onChange={set("status")}
                className={inputCls(!!fieldErrors.status)}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Project Code" error={fieldErrors.projectCode}>
              <input
                type="text"
                value={form.projectCode}
                onChange={set("projectCode")}
                placeholder="e.g. PRJ-001"
                className={inputCls(!!fieldErrors.projectCode)}
              />
            </Field>
          </div>

          {/* Region */}
          <Field label="Region" error={fieldErrors.region}>
            <input
              type="text"
              value={form.region}
              onChange={set("region")}
              placeholder="e.g. Metro Manila"
              className={inputCls(!!fieldErrors.region)}
            />
          </Field>

          {/* Budget + Spent */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Budget ($)" error={fieldErrors.budget}>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.budget}
                onChange={set("budget")}
                placeholder="0.00"
                className={inputCls(!!fieldErrors.budget)}
              />
            </Field>
            <Field label="Spent ($)" error={fieldErrors.spent}>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.spent}
                onChange={set("spent")}
                placeholder="0.00"
                className={inputCls(!!fieldErrors.spent)}
              />
            </Field>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Start Date" error={fieldErrors.startDate}>
              <input
                type="date"
                value={form.startDate}
                onChange={set("startDate")}
                className={inputCls(!!fieldErrors.startDate)}
              />
            </Field>
            <Field label="End Date" error={fieldErrors.endDate}>
              <input
                type="date"
                value={form.endDate}
                onChange={set("endDate")}
                className={inputCls(!!fieldErrors.endDate)}
              />
            </Field>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/60">
          <button
            type="button"
            onClick={() => !isSaving && onClose()}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-project-form"
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save size={14} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Small helper components ── */

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
          <AlertCircle size={11} />
          {error}
        </p>
      )}
    </div>
  );
}

function inputCls(hasError: boolean) {
  return [
    "w-full px-3 py-2 text-sm text-gray-900 bg-white border rounded-lg",
    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
    "placeholder:text-gray-400 transition-colors",
    hasError
      ? "border-red-400 focus:ring-red-400"
      : "border-gray-200 hover:border-gray-300",
  ].join(" ");
}