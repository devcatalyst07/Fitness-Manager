'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Plus, ChevronRight, Edit2, Trash2, Filter, X, Check } from 'lucide-react';
import { CreateScopeModal, EditScopeModal, AddWorkflowModal, ManageTasksModal } from './ScopeModals';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://fitout-manager-api.vercel.app';

interface Brand {
  _id: string;
  name: string;
}

interface PredefinedTask {
  _id: string;
  title: string;
  description?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  estimateHours?: number;
  order: number;
}

interface Phase {
  _id: string;
  name: string;
  description?: string;
  order: number;
  tasks: PredefinedTask[];
}

interface Workflow {
  _id: string;
  name: string;
  description?: string;
  phases: Phase[];
}

interface Scope {
  _id: string;
  name: string;
  description?: string;
  brandFilter: 'all' | 'specific';
  brandId?: string;
  brandName?: string;
  workflows: Workflow[];
  isActive: boolean;
  createdAt: string;
}

interface ScopeWorkflowArchitectureProps {
  onRefresh?: () => void;
  scopeId?: string;
  brandName?: string;
  canCreateScope?: boolean;
  userRole?: string;
}

export default function ScopeWorkflowArchitecture({ onRefresh }: ScopeWorkflowArchitectureProps) {
  const [scopes, setScopes] = useState<Scope[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [filterType, setFilterType] = useState<'all' | 'specific'>('all');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>('');
  
  const [expandedScope, setExpandedScope] = useState<string | null>(null);
  const [expandedWorkflow, setExpandedWorkflow] = useState<string | null>(null);
  const [isCreateScopeModalOpen, setIsCreateScopeModalOpen] = useState(false);
  const [isEditScopeModalOpen, setIsEditScopeModalOpen] = useState(false);
  const [selectedScope, setSelectedScope] = useState<Scope | null>(null);

  useEffect(() => {
    fetchBrands();
    fetchScopes();
  }, [filterType, selectedBrandFilter]);

  const fetchBrands = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/brands`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setBrands(data);
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
    }
  };

  const fetchScopes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      let url = `${API_URL}/api/scopes`;
      const params = new URLSearchParams();
      
      if (filterType === 'all') {
        params.append('brandFilter', 'all');
      } else if (filterType === 'specific' && selectedBrandFilter) {
        params.append('brandFilter', 'specific');
        params.append('brandId', selectedBrandFilter);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const scopesData = await response.json();
        
        // Fetch workflows with full details for each scope
        const scopesWithWorkflows = await Promise.all(
          scopesData.map(async (scope: Scope) => {
            const workflowsResponse = await fetch(
              `${API_URL}/api/scopes/${scope._id}/workflows`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            
            if (workflowsResponse.ok) {
              const workflows = await workflowsResponse.json();
              
              // Fetch full details for each workflow
              const fullWorkflows = await Promise.all(
                workflows.map(async (wf: Workflow) => {
                  const detailResponse = await fetch(
                    `${API_URL}/api/scopes/${scope._id}/workflows/${wf._id}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                  );
                  if (detailResponse.ok) {
                    return await detailResponse.json();
                  }
                  return wf;
                })
              );
              
              return { ...scope, workflows: fullWorkflows };
            }
            return { ...scope, workflows: [] };
          })
        );
        
        setScopes(scopesWithWorkflows);
      }
    } catch (error) {
      console.error('Error fetching scopes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteScope = async (scopeId: string) => {
    if (!confirm('Delete this scope? This will delete all workflows, phases, and tasks.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/scopes/${scopeId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        fetchScopes();
        if (onRefresh) onRefresh();
      }
    } catch (error) {
      console.error('Error deleting scope:', error);
    }
  };

  const toggleScopeExpansion = (scopeId: string) => {
    setExpandedScope(expandedScope === scopeId ? null : scopeId);
    setExpandedWorkflow(null);
  };

  const toggleWorkflowExpansion = (workflowId: string) => {
    setExpandedWorkflow(expandedWorkflow === workflowId ? null : workflowId);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Settings className="text-gray-700" size={24} />
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Scope & Workflow Architecture
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Define project scopes, workflows, and task templates
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsCreateScopeModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          <span>Create Scope</span>
        </button>
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
              checked={filterType === 'all'}
              onChange={() => { setFilterType('all'); setSelectedBrandFilter(''); }}
              className="text-blue-600"
            />
            <span className="text-sm text-gray-700">All Brands</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="brandFilter"
              value="specific"
              checked={filterType === 'specific'}
              onChange={() => setFilterType('specific')}
              className="text-blue-600"
            />
            <span className="text-sm text-gray-700">Specific Brand</span>
          </label>
        </div>

        {filterType === 'specific' && (
          <select
            value={selectedBrandFilter}
            onChange={(e) => setSelectedBrandFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
          >
            <option value="">-- Select Brand --</option>
            {brands.map((brand) => (
              <option key={brand._id} value={brand._id}>{brand.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Scopes List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading scopes...</p>
        </div>
      ) : scopes.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <Settings size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No scopes found</h3>
          <p className="text-gray-600 mb-4">
            {filterType === 'specific' && !selectedBrandFilter
              ? 'Please select a brand'
              : 'Create your first scope'}
          </p>
          {!(filterType === 'specific' && !selectedBrandFilter) && (
            <button
              onClick={() => setIsCreateScopeModalOpen(true)}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
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
              onEdit={() => { setSelectedScope(scope); setIsEditScopeModalOpen(true); }}
              onDelete={() => handleDeleteScope(scope._id)}
              onRefresh={fetchScopes}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {isCreateScopeModalOpen && (
        <CreateScopeModal
          brands={brands}
          onClose={() => setIsCreateScopeModalOpen(false)}
          onSuccess={() => { fetchScopes(); if (onRefresh) onRefresh(); }}
        />
      )}

      {isEditScopeModalOpen && selectedScope && (
        <EditScopeModal
          scope={selectedScope}
          brands={brands}
          onClose={() => { setIsEditScopeModalOpen(false); setSelectedScope(null); }}
          onSuccess={() => { fetchScopes(); if (onRefresh) onRefresh(); }}
        />
      )}
    </div>
  );
}

// ==================== SCOPE ITEM ====================
interface ScopeItemProps {
  scope: Scope;
  isExpanded: boolean;
  expandedWorkflow: string | null;
  onToggle: () => void;
  onToggleWorkflow: (workflowId: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  onRefresh: () => void;
}

function ScopeItem({ scope, isExpanded, expandedWorkflow, onToggle, onToggleWorkflow, onEdit, onDelete, onRefresh }: ScopeItemProps) {
  const [isAddWorkflowModalOpen, setIsAddWorkflowModalOpen] = useState(false);

  const handleDeleteWorkflow = async (workflowId: string) => {
    if (!confirm('Delete this workflow?')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/scopes/${scope._id}/workflows/${workflowId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      onRefresh();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
        <button onClick={onToggle} className="flex-1 flex items-center gap-3 text-left">
          <ChevronRight size={20} className={`text-gray-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{scope.name}</h3>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-gray-600">{scope.brandFilter === 'all' ? 'All Brands' : scope.brandName}</span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-600">{scope.workflows.length} workflow{scope.workflows.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </button>

        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-2 text-gray-600 hover:text-blue-600 rounded"><Edit2 size={16} /></button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-2 text-gray-600 hover:text-red-600 rounded"><Trash2 size={16} /></button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 bg-white border-t border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-gray-700">Workflows</h4>
            <button onClick={() => setIsAddWorkflowModalOpen(true)} className="flex items-center gap-1 text-xs px-3 py-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
              <Plus size={14} />
              <span>Add Workflow</span>
            </button>
          </div>

          {scope.workflows.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center border border-dashed rounded">No workflows yet</p>
          ) : (
            <div className="space-y-2">
              {scope.workflows.map((workflow) => (
                <WorkflowItem
                  key={workflow._id}
                  workflow={workflow}
                  scopeId={scope._id}
                  isExpanded={expandedWorkflow === workflow._id}
                  onToggle={() => onToggleWorkflow(workflow._id)}
                  onDelete={() => handleDeleteWorkflow(workflow._id)}
                  onRefresh={onRefresh}
                />
              ))}
            </div>
          )}

          {isAddWorkflowModalOpen && (
            <AddWorkflowModal
              scopeId={scope._id}
              onClose={() => setIsAddWorkflowModalOpen(false)}
              onSuccess={onRefresh}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ==================== WORKFLOW ITEM ====================
interface WorkflowItemProps {
  workflow: Workflow;
  scopeId: string;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onRefresh: () => void;
}

function WorkflowItem({ workflow, scopeId, isExpanded, onToggle, onDelete, onRefresh }: WorkflowItemProps) {
  const [isManageTasksModalOpen, setIsManageTasksModalOpen] = useState(false);
  const totalTasks = workflow.phases?.reduce((sum, phase) => sum + (phase.tasks?.length || 0), 0) || 0;

  return (
    <div className="border border-gray-200 rounded-lg bg-gray-50">
      <div className="flex items-center justify-between p-3">
        <button onClick={onToggle} className="flex-1 flex items-center gap-3 text-left">
          <ChevronRight size={18} className={`text-gray-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-900">{workflow.name}</h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-gray-600">{workflow.phases?.length || 0} phase{(workflow.phases?.length || 0) !== 1 ? 's' : ''}</span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-600">{totalTasks} task{totalTasks !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </button>

        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); setIsManageTasksModalOpen(true); }} className="p-1.5 text-gray-600 hover:text-blue-600 rounded" title="Manage">
            <Settings size={14} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1.5 text-gray-600 hover:text-red-600 rounded">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-3 bg-white border-t border-gray-200">
          {!workflow.phases || workflow.phases.length === 0 ? (
            <p className="text-xs text-gray-500 py-3 text-center">No phases/tasks. Click settings to add them.</p>
          ) : (
            <div className="space-y-3">
              {workflow.phases.map((phase) => (
                <div key={phase._id} className="bg-gray-50 rounded-lg p-3">
                  <h5 className="text-xs font-semibold text-gray-700 mb-2">{phase.name}</h5>
                  {!phase.tasks || phase.tasks.length === 0 ? (
                    <p className="text-xs text-gray-500 italic">No tasks</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {phase.tasks.map((task) => (
                        <li key={task._id} className="flex items-start gap-2 text-xs">
                          <Check size={14} className="text-green-600 mt-0.5" />
                          <div className="flex-1">
                            <span className="font-medium">{task.title}</span>
                            {task.description && <p className="text-gray-600 mt-0.5">{task.description}</p>}
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`px-1.5 py-0.5 rounded text-xs ${
                                task.priority === 'Critical' ? 'bg-red-100 text-red-700' :
                                task.priority === 'High' ? 'bg-orange-100 text-orange-700' :
                                task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>{task.priority}</span>
                              {task.estimateHours && <span className="text-gray-500">{task.estimateHours}h</span>}
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

      {isManageTasksModalOpen && (
        <ManageTasksModal scopeId={scopeId} workflowId={workflow._id} onClose={() => setIsManageTasksModalOpen(false)} onSuccess={onRefresh} />
      )}
    </div>
  );
}