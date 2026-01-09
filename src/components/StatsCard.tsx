import React from 'react';

interface StatsCardProps {
  title: string;
  value: number;
  color: string;
}

export function StatsCard({ title, value, color }: StatsCardProps) {
  const bgColors: { [key: string]: string } = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    purple: 'bg-purple-50 border-purple-200',
    orange: 'bg-orange-50 border-orange-200',
  };

  const textColors: { [key: string]: string } = {
    blue: 'text-blue-700',
    green: 'text-green-700',
    purple: 'text-purple-700',
    orange: 'text-orange-700',
  };

  return (
    <div className={`${bgColors[color]} border-2 rounded-lg p-6`}>
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <p className={`text-4xl font-bold ${textColors[color]}`}>{value}</p>
    </div>
  );
}