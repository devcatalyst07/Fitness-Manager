"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Plus,
  ChevronRight,
  Edit2,
  Trash2,
  Filter,
  Download,
  Upload,
  X,
  Check,
} from "lucide-react";
import { hasPermission } from "@/utils/permissions";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://fitout-manager-api.vercel.app";

interface Permission {
  id: string;
  label: string;
  checked: boolean;
  children?: Permission[];
}

interface Brand {
  _id: string;
  name: string;
}

interface PredefinedTask {
  _id: string;
  title: string;
  description?: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  estimateHours?: number;
  order: number;
}

interface Phase {
  _id: string;
  name: string;
  order: number;
  tasks: PredefinedTask[];
}

interface Workflow {
  _id: string;
  name: string;
  description?: string;
  phases: Phase[];
  canCreateScope: boolean;
}

interface Scope {
  _id: string;
  name: string;
  description?: string;
  brandFilter: "all" | "specific";
  brandId?: string;
  brandName?: string;
  workflows: Workflow[];
  isActive: boolean;
  createdAt: string;
}

interface ScopeWorkflowArchitectureProps {
  onRefresh?: () => void;
  scopeId: string;
  brandName: string;
  canCreateScope?: boolean;
  userRole?: "admin" | "user";
}

export default function ScopeWorkflowArchitecture({
  onRefresh,
  scopeId,
  brandName,
  canCreateScope = false,
  userRole = "admin",
}: ScopeWorkflowArchitectureProps) {
  const [scopes, setScopes] = useState<Scope[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<Permission[]>([]);

  // Filter states
  const [filterType, setFilterType] = useState<"all" | "specific">("all");
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>("");

  // UI states
  const [expandedScope, setExpandedScope] = useState<string | null>(null);
  const [expandedWorkflow, setExpandedWorkflow] = useState<string | null>(null);
  const [isCreateScopeModalOpen, setIsCreateScopeModalOpen] = useState(false);
  const [isEditScopeModalOpen, setIsEditScopeModalOpen] = useState(false);
  const [selectedScope, setSelectedScope] = useState<Scope | null>(null);

  useEffect(() => {
    fetchBrands();
    fetchScopes();
    fetchUserPermissions();
  }, [filterType, selectedBrandFilter, scopeId]);

  const fetchUserPermissions = async () => {
    try {
      const roleId = localStorage.getItem("roleId");
      const token = localStorage.getItem("token");

      if (!roleId) {
        // Admin or no specific role
        setPermissions([]);
        return;
      }

      const response = await fetch(`${API_URL}/api/roles/${roleId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setPermissions(data.permissions || []);
      }
    } catch (error) {
      console.error("Error fetching permissions:", error);
    }
  };

  const fetchBrands = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/brands`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setBrands(data);
      }
    } catch (error) {
      console.error("Error fetching brands:", error);
    }
  };

  const fetchScopes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      let url = `${API_URL}/api/scopes`;
      const params = new URLSearchParams();

      if (filterType === "all") {
        params.append("brandFilter", "all");
      } else if (filterType === "specific" && selectedBrandFilter) {
        params.append("brandFilter", "specific");
        params.append("brandId", selectedBrandFilter);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setScopes(data);
      }
    } catch (error) {
      console.error("Error fetching scopes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteScope = async (scopeId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this scope? This will delete all associated workflows and tasks.",
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/scopes/${scopeId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        fetchScopes();
        if (onRefresh) onRefresh();
      } else {
        const data = await response.json();
        alert(data.message || "Failed to delete scope");
      }
    } catch (error) {
      console.error("Error deleting scope:", error);
      alert("Failed to delete scope");
    }
  };

  const handleDeleteWorkflow = async (scopeId: string, workflowId: string) => {
    if (!confirm("Are you sure you want to delete this workflow?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/scopes/${scopeId}/workflows/${workflowId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        fetchScopes();
      } else {
        const data = await response.json();
        alert(data.message || "Failed to delete workflow");
      }
    } catch (error) {
      console.error("Error deleting workflow:", error);
      alert("Failed to delete workflow");
    }
  };

  const toggleScopeExpansion = (scopeId: string) => {
    setExpandedScope(expandedScope === scopeId ? null : scopeId);
    setExpandedWorkflow(null);
  };

  const toggleWorkflowExpansion = (workflowId: string) => {
    setExpandedWorkflow(expandedWorkflow === workflowId ? null : workflowId);
  };

  // Determine if user can create scopes
  const canCreateScopeButton =
    userRole === "admin"
      ? true
      : hasPermission("dashboard-create-scope", permissions) || canCreateScope;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Scope & Workflow Architecture
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Define project scopes, workflows, and task templates
            </p>
          </div>
        </div>
        {canCreateScopeButton && (
          <button
            onClick={() => setIsCreateScopeModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            <span>Create Scope</span>
          </button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Filter by:</span>
        </div>

        <div className="flex-1 flex flex-wrap gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="brandFilter"
              value="all"
              checked={filterType === "all"}
              onChange={() => {
                setFilterType("all");
                setSelectedBrandFilter("");
              }}
              className="text-black focus:ring-black"
            />
            <span className="text-sm text-gray-700">All Brands</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="brandFilter"
              value="specific"
              checked={filterType === "specific"}
              onChange={() => setFilterType("specific")}
              className="text-black focus:ring-black"
            />
            <span className="text-sm text-gray-700">Specific Brand</span>
          </label>
        </div>

        {filterType === "specific" && (
          <select
            value={selectedBrandFilter}
            onChange={(e) => setSelectedBrandFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
          >
            <option value="">Select Brand</option>
            {brands.map((brand) => (
              <option key={brand._id} value={brand._id}>
                {brand.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Scopes List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading scopes...</p>
        </div>
      ) : scopes.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <Settings size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No scopes found
          </h3>
          <p className="text-gray-600 mb-4">
            {filterType === "specific" && !selectedBrandFilter
              ? "Please select a brand to view its scopes"
              : "Create your first scope to get started"}
          </p>
          {!(filterType === "specific" && !selectedBrandFilter) &&
            canCreateScopeButton && (
              <button
                onClick={() => setIsCreateScopeModalOpen(true)}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={20} />
                <span>Create Scope</span>
              </button>
            )}
        </div>
      ) : (
        <div className="space-y-3">
          {scopes.map((scope) => (
            <ScopeItem
              key={scope._id}
              scope={scope}
              isExpanded={expandedScope === scope._id}
              expandedWorkflow={expandedWorkflow}
              onToggle={() => toggleScopeExpansion(scope._id)}
              onToggleWorkflow={toggleWorkflowExpansion}
              onEdit={() => {
                setSelectedScope(scope);
                setIsEditScopeModalOpen(true);
              }}
              onDelete={() => handleDeleteScope(scope._id)}
              onDeleteWorkflow={(workflowId) =>
                handleDeleteWorkflow(scope._id, workflowId)
              }
              onRefresh={fetchScopes}
            />
          ))}
        </div>
      )}

      {/* Create Scope Modal */}
      {isCreateScopeModalOpen && (
        <CreateScopeModal
          brands={brands}
          onClose={() => setIsCreateScopeModalOpen(false)}
          onSuccess={() => {
            fetchScopes();
            if (onRefresh) onRefresh();
          }}
        />
      )}

      {/* Edit Scope Modal */}
      {isEditScopeModalOpen && selectedScope && (
        <EditScopeModal
          scope={selectedScope}
          brands={brands}
          onClose={() => {
            setIsEditScopeModalOpen(false);
            setSelectedScope(null);
          }}
          onSuccess={() => {
            fetchScopes();
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </div>
  );
}

// ==================== SCOPE ITEM COMPONENT ====================
interface ScopeItemProps {
  scope: Scope;
  isExpanded: boolean;
  expandedWorkflow: string | null;
  onToggle: () => void;
  onToggleWorkflow: (workflowId: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  onDeleteWorkflow: (workflowId: string) => void;
  onRefresh: () => void;
}

function ScopeItem({
  scope,
  isExpanded,
  expandedWorkflow,
  onToggle,
  onToggleWorkflow,
  onEdit,
  onDelete,
  onDeleteWorkflow,
  onRefresh,
}: ScopeItemProps) {
  const [isAddWorkflowModalOpen, setIsAddWorkflowModalOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(
    null,
  );
  const [isEditWorkflowModalOpen, setIsEditWorkflowModalOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Scope Header */}
      <div className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
        <button
          onClick={onToggle}
          className="flex-1 flex items-center gap-3 text-left"
        >
          <ChevronRight
            size={20}
            className={`text-gray-600 transition-transform ${
              isExpanded ? "rotate-90" : ""
            }`}
          />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{scope.name}</h3>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-gray-600">
                {scope.brandFilter === "all" ? "All Brands" : scope.brandName}
              </span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-600">
                {scope.workflows.length} workflow
                {scope.workflows.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-2 text-gray-600 hover:text-black hover:bg-white rounded-lg transition-colors"
            title="Edit scope"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-white rounded-lg transition-colors"
            title="Delete scope"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Workflows List */}
      {isExpanded && (
        <div className="p-4 bg-white border-t border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-gray-700">Workflows</h4>
            <button
              onClick={() => setIsAddWorkflowModalOpen(true)}
              className="flex items-center gap-1 text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              <Plus size={14} />
              <span>Add Workflow</span>
            </button>
          </div>

          {scope.workflows.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center border border-dashed border-gray-300 rounded">
              No workflows yet. Click "Add Workflow" to create one.
            </p>
          ) : (
            <div className="space-y-2">
              {scope.workflows.map((workflow) => (
                <WorkflowItem
                  key={workflow._id}
                  workflow={workflow}
                  scopeId={scope._id}
                  isExpanded={expandedWorkflow === workflow._id}
                  onToggle={() => onToggleWorkflow(workflow._id)}
                  onEdit={() => {
                    setSelectedWorkflow(workflow);
                    setIsEditWorkflowModalOpen(true);
                  }}
                  onDelete={() => onDeleteWorkflow(workflow._id)}
                  onRefresh={onRefresh}
                />
              ))}
            </div>
          )}

          {/* Add Workflow Modal */}
          {isAddWorkflowModalOpen && (
            <AddWorkflowModal
              scopeId={scope._id}
              onClose={() => setIsAddWorkflowModalOpen(false)}
              onSuccess={onRefresh}
            />
          )}

          {/* Edit Workflow Modal */}
          {isEditWorkflowModalOpen && selectedWorkflow && (
            <EditWorkflowModal
              scopeId={scope._id}
              workflow={selectedWorkflow}
              onClose={() => {
                setIsEditWorkflowModalOpen(false);
                setSelectedWorkflow(null);
              }}
              onSuccess={onRefresh}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ==================== WORKFLOW ITEM COMPONENT ====================
interface WorkflowItemProps {
  workflow: Workflow;
  scopeId: string;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onRefresh: () => void;
}

function WorkflowItem({
  workflow,
  scopeId,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  onRefresh,
}: WorkflowItemProps) {
  const [isManageTasksModalOpen, setIsManageTasksModalOpen] = useState(false);

  const totalTasks = workflow.phases.reduce(
    (sum, phase) => sum + phase.tasks.length,
    0,
  );

  const handleExportExcel = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/scopes/${scopeId}/workflows/${workflow._id}/export`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        const data = await response.json();
        // Trigger download - this would be implemented with actual Excel generation
        alert("Export functionality ready. Data: " + JSON.stringify(data));
      }
    } catch (error) {
      console.error("Export error:", error);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
      {/* Workflow Header */}
      <div className="flex items-center justify-between p-3">
        <button
          onClick={onToggle}
          className="flex-1 flex items-center gap-3 text-left"
        >
          <ChevronRight
            size={18}
            className={`text-gray-600 transition-transform ${
              isExpanded ? "rotate-90" : ""
            }`}
          />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-900">
              {workflow.name}
            </h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-gray-600">
                {workflow.phases.length} phase
                {workflow.phases.length !== 1 ? "s" : ""}
              </span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-600">
                {totalTasks} task{totalTasks !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleExportExcel();
            }}
            className="p-1.5 text-gray-600 hover:text-black hover:bg-white rounded transition-colors"
            title="Export to Excel"
          >
            <Download size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsManageTasksModalOpen(true);
            }}
            className="p-1.5 text-gray-600 hover:text-black hover:bg-white rounded transition-colors"
            title="Manage tasks"
          >
            <Settings size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-1.5 text-gray-600 hover:text-black hover:bg-white rounded transition-colors"
            title="Edit workflow"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-white rounded transition-colors"
            title="Delete workflow"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Phases and Tasks */}
      {isExpanded && (
        <div className="p-3 bg-white border-t border-gray-200">
          {workflow.phases.length === 0 ? (
            <p className="text-xs text-gray-500 py-3 text-center border border-dashed border-gray-300 rounded">
              No phases or tasks defined. Click "Manage tasks" to add them.
            </p>
          ) : (
            <div className="space-y-3">
              {workflow.phases.map((phase) => (
                <div key={phase._id} className="bg-gray-50 rounded-lg p-3">
                  <h5 className="text-xs font-semibold text-gray-700 mb-2">
                    {phase.name}
                  </h5>
                  {phase.tasks.length === 0 ? (
                    <p className="text-xs text-gray-500 italic">No tasks</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {phase.tasks.map((task) => (
                        <li
                          key={task._id}
                          className="flex items-start gap-2 text-xs text-gray-700"
                        >
                          <Check
                            size={14}
                            className="text-green-600 mt-0.5 flex-shrink-0"
                          />
                          <div className="flex-1">
                            <span className="font-medium">{task.title}</span>
                            {task.description && (
                              <p className="text-gray-600 mt-0.5">
                                {task.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className={`inline-block px-1.5 py-0.5 rounded text-xs ${
                                  task.priority === "Critical"
                                    ? "bg-red-100 text-red-700"
                                    : task.priority === "High"
                                      ? "bg-orange-100 text-orange-700"
                                      : task.priority === "Medium"
                                        ? "bg-yellow-100 text-yellow-700"
                                        : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {task.priority}
                              </span>
                              {task.estimateHours && (
                                <span className="text-gray-500">
                                  {task.estimateHours}h
                                </span>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Manage Tasks Modal */}
      {isManageTasksModalOpen && (
        <ManageTasksModal
          scopeId={scopeId}
          workflow={workflow}
          onClose={() => setIsManageTasksModalOpen(false)}
          onSuccess={onRefresh}
        />
      )}
    </div>
  );
}

// ==================== CREATE SCOPE MODAL ====================
interface CreateScopeModalProps {
  brands: Brand[];
  onClose: () => void;
  onSuccess: () => void;
}

function CreateScopeModal({
  brands,
  onClose,
  onSuccess,
}: CreateScopeModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    brandFilter: "all" as "all" | "specific",
    brandId: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/scopes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await response.json();
        alert(data.message || "Failed to create scope");
      }
    } catch (error) {
      console.error("Error creating scope:", error);
      alert("Failed to create scope");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Create New Scope</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Scope Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Brand Filter *
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="brandFilter"
                  value="all"
                  checked={formData.brandFilter === "all"}
                  onChange={() =>
                    setFormData({
                      ...formData,
                      brandFilter: "all",
                      brandId: "",
                    })
                  }
                  className="text-blue-600 focus:ring-blue-600"
                />
                <span className="text-sm text-gray-700">All Brands</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="brandFilter"
                  value="specific"
                  checked={formData.brandFilter === "specific"}
                  onChange={() =>
                    setFormData({ ...formData, brandFilter: "specific" })
                  }
                  className="text-blue-600 focus:ring-blue-600"
                />
                <span className="text-sm text-gray-700">Specific Brand</span>
              </label>
            </div>
          </div>

          {formData.brandFilter === "specific" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Brand *
              </label>
              <select
                value={formData.brandId}
                onChange={(e) =>
                  setFormData({ ...formData, brandId: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              >
                <option value="">Select Brand</option>
                {brands.map((brand) => (
                  <option key={brand._id} value={brand._id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Scope"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==================== EDIT SCOPE MODAL ====================
interface EditScopeModalProps {
  scope: Scope;
  brands: Brand[];
  onClose: () => void;
  onSuccess: () => void;
}

function EditScopeModal({
  scope,
  brands,
  onClose,
  onSuccess,
}: EditScopeModalProps) {
  const [formData, setFormData] = useState({
    name: scope.name,
    description: scope.description || "",
    brandFilter: scope.brandFilter,
    brandId: scope.brandId || "",
    isActive: scope.isActive,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/scopes/${scope._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await response.json();
        alert(data.message || "Failed to update scope");
      }
    } catch (error) {
      console.error("Error updating scope:", error);
      alert("Failed to update scope");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Edit Scope</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Scope Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Brand Filter *
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="brandFilter"
                  value="all"
                  checked={formData.brandFilter === "all"}
                  onChange={() =>
                    setFormData({
                      ...formData,
                      brandFilter: "all",
                      brandId: "",
                    })
                  }
                  className="text-blue-600 focus:ring-blue-600"
                />
                <span className="text-sm text-gray-700">All Brands</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="brandFilter"
                  value="specific"
                  checked={formData.brandFilter === "specific"}
                  onChange={() =>
                    setFormData({ ...formData, brandFilter: "specific" })
                  }
                  className="text-blue-600 focus:ring-blue-600"
                />
                <span className="text-sm text-gray-700">Specific Brand</span>
              </label>
            </div>
          </div>

          {formData.brandFilter === "specific" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Brand *
              </label>
              <select
                value={formData.brandId}
                onChange={(e) =>
                  setFormData({ ...formData, brandId: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              >
                <option value="">Select Brand</option>
                {brands.map((brand) => (
                  <option key={brand._id} value={brand._id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="text-blue-600 focus:ring-blue-600"
              />
              <span className="text-sm text-gray-700">Active</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update Scope"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==================== ADD WORKFLOW MODAL ====================
interface AddWorkflowModalProps {
  scopeId: string;
  onClose: () => void;
  onSuccess: () => void;
}

function AddWorkflowModal({
  scopeId,
  onClose,
  onSuccess,
}: AddWorkflowModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/scopes/${scopeId}/workflows`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        },
      );

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await response.json();
        alert(data.message || "Failed to add workflow");
      }
    } catch (error) {
      console.error("Error adding workflow:", error);
      alert("Failed to add workflow");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Add Workflow</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Workflow Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Adding..." : "Add Workflow"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==================== EDIT WORKFLOW MODAL ====================
interface EditWorkflowModalProps {
  scopeId: string;
  workflow: Workflow;
  onClose: () => void;
  onSuccess: () => void;
}

function EditWorkflowModal({
  scopeId,
  workflow,
  onClose,
  onSuccess,
}: EditWorkflowModalProps) {
  const [formData, setFormData] = useState({
    name: workflow.name,
    description: workflow.description || "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/scopes/${scopeId}/workflows/${workflow._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        },
      );

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await response.json();
        alert(data.message || "Failed to update workflow");
      }
    } catch (error) {
      console.error("Error updating workflow:", error);
      alert("Failed to update workflow");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Edit Workflow</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Workflow Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update Workflow"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==================== MANAGE TASKS MODAL ====================
interface ManageTasksModalProps {
  scopeId: string;
  workflow: Workflow;
  onClose: () => void;
  onSuccess: () => void;
}

function ManageTasksModal({
  scopeId,
  workflow,
  onClose,
  onSuccess,
}: ManageTasksModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">
            Manage Tasks: {workflow.name}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="text-center py-8 text-gray-500">
          <p className="mb-4">Task management interface coming soon...</p>
          <p className="text-sm">
            This will allow you to add, edit, and organize phases and tasks
            within the workflow.
          </p>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
