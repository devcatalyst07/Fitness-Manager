import React from 'react';
import { X, Building2, MapPin, Calendar } from 'lucide-react';

interface Project {
  _id: string;
  projectName: string;
  brand: string;
  scope: string;
  workflow: string;
  projectCode?: string;
  description?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  budget: number;
  spent: number;
  status: 'Planning' | 'In Progress' | 'Completed' | 'On Hold';
  userId: {
    name: string;
    email: string;
  };
  createdBy: 'user' | 'admin';
  createdAt: string;
}

interface ProjectCardProps {
  project: Project;
  onUpdate: () => void;
}

export function ProjectCard({ project, onUpdate }: ProjectCardProps) {
  const budgetUtilization = project.budget > 0 ? (project.spent / project.budget) * 100 : 0;
  
  const statusColors: { [key: string]: string } = {
    'Planning': 'bg-orange-100 text-orange-700',
    'In Progress': 'bg-blue-100 text-blue-700',
    'Completed': 'bg-green-100 text-green-700',
    'On Hold': 'bg-gray-100 text-gray-700',
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-bold text-gray-900">{project.projectName}</h3>
        <button className="text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>
      </div>

      {project.description && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{project.description}</p>
      )}

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <Building2 size={16} className="mr-2" />
          <span>{project.brand}</span>
        </div>
        {project.location && (
          <div className="flex items-center text-sm text-gray-600">
            <MapPin size={16} className="mr-2" />
            <span>{project.location}</span>
          </div>
        )}
        <div className="flex items-center text-sm text-gray-600">
          <Calendar size={16} className="mr-2" />
          <span>{formatDate(project.startDate)} - {formatDate(project.endDate)}</span>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Budget</span>
          <span className="font-semibold">{formatCurrency(project.budget)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Spent</span>
          <span className="font-semibold">{formatCurrency(project.spent)}</span>
        </div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Budget Utilization</span>
          <span className="font-semibold">{budgetUtilization.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${
              budgetUtilization >= 100 ? 'bg-red-500' :
              budgetUtilization >= 75 ? 'bg-orange-500' :
              'bg-green-500'
            }`}
            style={{ width: `${Math.min(budgetUtilization, 100)}%` }}
          />
        </div>
      </div>

      <div className="flex justify-between items-center">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[project.status]}`}>
          {project.status}
        </span>
        <div className="flex gap-2">
          <button className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            View Details
          </button>
          <button className="px-4 py-2 text-sm bg-black text-white hover:bg-gray-800 rounded-lg transition-colors">
            Manage Budget
          </button>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
        Created by: {project.userId.name}
      </div>
    </div>
  );
}