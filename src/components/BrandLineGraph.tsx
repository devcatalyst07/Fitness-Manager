import React, { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Project {
  _id: string;
  projectName: string;
  status: string;
  budget?: number;
  spent?: number;
  createdAt: string;
}

interface BrandLineGraphProps {
  projects: Project[];
}

export default function BrandLineGraph({ projects }: BrandLineGraphProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const currentMonthIndex = new Date().getMonth();
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // Get selected project(s)
  const selectedProjects = useMemo(() => {
    if (selectedProjectId === "all") {
      return projects;
    }
    return projects.filter((p) => p._id === selectedProjectId);
  }, [selectedProjectId, projects]);

  // Calculate totals
  const totalBudget = selectedProjects.reduce(
    (sum, p) => sum + (p.budget || 0),
    0,
  );
  const totalSpent = selectedProjects.reduce(
    (sum, p) => sum + (p.spent || 0),
    0,
  );

  // Generate chart data - only up to current month with multiple data points
  const chartData = useMemo(() => {
    const data = [];
    const currentYear = new Date().getFullYear();
    const currentDay = new Date().getDate();

    for (let i = 0; i <= currentMonthIndex; i++) {
      // For current month, add multiple data points; for past months, just one
      const daysInMonth =
        i === currentMonthIndex
          ? currentDay
          : new Date(currentYear, i + 1, 0).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        // Calculate remaining budget based on actual spending progression
        const totalDays =
          i === currentMonthIndex
            ? currentDay
            : new Date(currentYear, i + 1, 0).getDate();
        const dayProgress = day / totalDays;
        const monthsElapsed = i + dayProgress / 31; // Approximate month progression
        const totalMonthsProgress = monthsElapsed / 12;

        const estimatedSpent = totalSpent * totalMonthsProgress;
        const remaining = Math.max(0, totalBudget - estimatedSpent);

        // Generate a timestamp for this day
        const dayDate = new Date(currentYear, i, day);
        const timestamp = dayDate.toISOString();

        data.push({
          month: months[i],
          day: day,
          budget: remaining,
          spent: estimatedSpent,
          timestamp: timestamp,
          date: `${months[i]} ${day}, ${currentYear}`,
        });
      }
    }

    return data;
  }, [selectedProjects, totalBudget, totalSpent, currentMonthIndex]);

  // Calculate Y-axis max (add 20% padding)
  const maxValue = Math.ceil(totalBudget * 1.2);

  // Custom Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const date = new Date(data.timestamp);
      const formattedDate = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const formattedTime = date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });

      return (
        <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3">
          <div className="text-sm font-semibold mb-2">{data.month}</div>
          <div className="text-xs text-gray-500 mb-2">
            {formattedDate} at {formattedTime}
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="text-gray-600">remaining:</span>
              <span className="font-medium">
                ₱{Math.round(payload[0].value).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span className="text-gray-600">spent:</span>
              <span className="font-medium">
                ₱{Math.round(data.spent).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Budget Tracking
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Remaining: ₱{(totalBudget - totalSpent).toLocaleString()} / ₱
            {totalBudget.toLocaleString()}
          </p>
              </div>
              
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="all">All Projects</option>
          {projects.map((project) => (
            <option key={project._id} value={project._id}>
              {project.projectName}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-6 mb-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-gray-600">Budget Remaining</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="4 4"
            stroke="#e5e7eb"
            vertical={false}
          />
          <XAxis
            dataKey="month"
            stroke="#6b7280"
            style={{ fontSize: "12px" }}
            tickLine={false}
          />
          <YAxis
            stroke="#6b7280"
            style={{ fontSize: "12px" }}
            tickLine={false}
            domain={[0, maxValue]}
            tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#e5e7eb" }} />
          <Line
            type="monotone"
            dataKey="budget"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{ fill: "#3b82f6", r: 5 }}
            activeDot={{ r: 7 }}
            isAnimationActive={true}
            connectNulls={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
