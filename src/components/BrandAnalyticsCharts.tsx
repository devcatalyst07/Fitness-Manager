import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface BrandAnalytic {
  brandId: string;
  brandName: string;
  projectCount: number;
  taskStatusData: { status: string; count: number }[];
  budgetStatusData: { status: string; amount: number }[];
  totalTasks: number;
  completedTasks: number;
  totalBudget: number;
  totalSpent: number;
}

interface BrandAnalyticsChartsProps {
  brandAnalytics: BrandAnalytic[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function BrandAnalyticsCharts({ brandAnalytics }: BrandAnalyticsChartsProps) {
  if (brandAnalytics.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <p className="text-gray-500">No brand data available</p>
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
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Brand Analytics</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {brandAnalytics.map((brand, index) => (
            <div key={brand.brandId} className="space-y-6">
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold text-gray-900">{brand.brandName}</h3>
                <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Projects: </span>
                    <span className="font-semibold text-gray-900">{brand.projectCount}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Tasks: </span>
                    <span className="font-semibold text-gray-900">
                      {brand.completedTasks}/{brand.totalTasks}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Budget: </span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(brand.totalBudget)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Spent: </span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(brand.totalSpent)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Task Status Pie Chart */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Task Distribution</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={brand.taskStatusData.filter(d => d.count > 0)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, count, percent }) => 
                        `${status}: ${count} (${(percent * 100).toFixed(0)}%)`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {brand.taskStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Budget Status Chart */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Budget Breakdown</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={brand.budgetStatusData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="status" 
                      stroke="#6b7280"
                      style={{ fontSize: '11px' }}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      style={{ fontSize: '11px' }}
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
                      fill="#8b5cf6" 
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