import React from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ProjectAnalytic {
  projectId: string;
  projectName: string;
  brand: string;
  taskStatusData: { status: string; count: number }[];
  budgetStatusData: { status: string; amount: number }[];
  totalTasks: number;
  completedTasks: number;
  totalBudget: number;
  totalSpent: number;
}

interface ProjectAnalyticsChartsProps {
  projectAnalytics: ProjectAnalytic[];
}

export default function ProjectAnalyticsCharts({ projectAnalytics }: ProjectAnalyticsChartsProps) {
  if (projectAnalytics.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <p className="text-gray-500">No project data available</p>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Project Analytics</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {projectAnalytics.map((project) => (
            <div key={project.projectId} className="space-y-6">
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold text-gray-900">{project.projectName}</h3>
                <p className="text-sm text-gray-500">{project.brand}</p>
                <div className="mt-2 flex gap-4 text-sm">
                  <span className="text-gray-600">
                    Tasks: <span className="font-semibold text-gray-900">{project.completedTasks}/{project.totalTasks}</span>
                  </span>
                  <span className="text-gray-600">
                    Budget: <span className="font-semibold text-gray-900">{formatCurrency(project.totalSpent)}/{formatCurrency(project.totalBudget)}</span>
                  </span>
                </div>
              </div>

              {/* Task Status Chart */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Task Status Distribution</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={project.taskStatusData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="status" 
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                      allowDecimals={false}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="#3b82f6" 
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Budget Status Chart */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Budget Status Distribution</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={project.budgetStatusData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="status" 
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Bar 
                      dataKey="amount" 
                      fill="#10b981" 
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}