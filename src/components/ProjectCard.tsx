'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, DollarSign, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface Project {
  _id: string;
  projectName: string;
  brand: string;
  scope: string;
  workflow: string;
  status: string;
  budget: number;
  spent: number;
  startDate?: string;
  endDate?: string;
  calculatedStartDate?: string;
  calculatedEndDate?: string;
  isAtRisk?: boolean;
  riskReason?: string;
}

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  // ✅ FIXED: Determine link path based on user role
  // Previously hardcoded to /admin/projects/... which caused
  // non-admin users to be redirected to dashboard by ProtectedRoute
  const { user } = useAuth();
  const basePath = user?.role === 'admin' ? '/admin' : '/user';

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      Planning: 'bg-blue-100 text-blue-700 border-blue-200',
      'In Progress': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'On Hold': 'bg-gray-100 text-gray-700 border-gray-200',
      Completed: 'bg-green-100 text-green-700 border-green-200',
      Cancelled: 'bg-red-100 text-red-700 border-red-200',
    };
    return badges[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const budgetPercentage = project.budget > 0 
    ? Math.min((project.spent / project.budget) * 100, 100) 
    : 0;

  return (
    <Link href={`${basePath}/projects/${project._id}`}>
      <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-xl transition-all duration-300 cursor-pointer group">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
              {project.projectName}
            </h3>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-gray-600">{project.brand}</span>
              <span className="text-gray-400">•</span>
              <span className="text-sm text-gray-600">{project.scope}</span>
            </div>
          </div>
          
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(project.status)}`}
          >
            {project.status}
          </span>
        </div>

        {/* Risk Warning */}
        {project.isAtRisk && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
            <AlertTriangle size={16} className="text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-yellow-800">At Risk</p>
              <p className="text-xs text-yellow-700 mt-0.5">{project.riskReason}</p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {/* Dates */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar size={16} className="text-gray-400" />
            <span>
              {project.calculatedStartDate 
                ? new Date(project.calculatedStartDate).toLocaleDateString()
                : project.startDate 
                  ? new Date(project.startDate).toLocaleDateString()
                  : 'No start date'
              }
              {' → '}
              {project.calculatedEndDate 
                ? new Date(project.calculatedEndDate).toLocaleDateString()
                : project.endDate 
                  ? new Date(project.endDate).toLocaleDateString()
                  : 'No end date'
              }
            </span>
          </div>

          {/* Budget */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <DollarSign size={16} className="text-gray-400" />
                <span>Budget</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                ${project.spent.toLocaleString()} / ${project.budget.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  budgetPercentage > 90
                    ? 'bg-red-500'
                    : budgetPercentage > 75
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                }`}
                style={{ width: `${budgetPercentage}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>Workflow: {project.workflow}</span>
          <span className="text-blue-600 group-hover:text-blue-700 font-medium">
            View Details →
          </span>
        </div>
      </div>
    </Link>
  );
}