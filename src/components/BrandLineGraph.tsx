import React, { useMemo, useState, useEffect } from "react";
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
  updatedAt?: string;
}

interface BrandLineGraphProps {
  projects: Project[];
}

interface BudgetItem {
  createdAt: string;
  quantity: number;
  unitCost: number;
}

export default function BrandLineGraph({ projects }: BrandLineGraphProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [budgetHistory, setBudgetHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear(),
  );
  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth(),
  );

  const selectedProjects = useMemo(() => {
    if (selectedProjectId === "all") {
      return projects;
    }
    return projects.filter((p) => p._id === selectedProjectId);
  }, [selectedProjectId, projects]);

  const totalBudget = selectedProjects.reduce(
    (sum, p) => sum + (p.budget || 0),
    0,
  );
  const totalSpent = selectedProjects.reduce(
    (sum, p) => sum + (p.spent || 0),
    0,
  );
  const remaining = totalBudget - totalSpent;

  useEffect(() => {
    if (selectedProjects.length > 0) {
      fetchBudgetHistory();
    }
  }, [selectedProjects, selectedYear, selectedMonth]);

  const fetchBudgetHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL ||
        "https://fitout-manager-api.vercel.app";

      const allBudgetItems: BudgetItem[] = [];

      for (const project of selectedProjects) {
        const response = await fetch(
          `${API_URL}/api/projects/${project._id}/budget`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (response.ok) {
          const categories = await response.json();
          categories.forEach((cat: any) => {
            allBudgetItems.push(...cat.items);
          });
        }
      }

      generateChartData(allBudgetItems);
    } catch (error) {
      console.error("Error fetching budget history:", error);
      setBudgetHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const generateChartData = (budgetItems: BudgetItem[]) => {
    const data: any[] = [];
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

    const chartYear = selectedYear;
    const chartMonth = selectedMonth;
    const startMonth = 0;
    const endMonth = chartMonth;

    if (budgetItems.length === 0) {
      for (let i = startMonth; i <= endMonth; i++) {
        data.push({
          month: months[i],
          budget: totalBudget,
          spent: 0,
          monthSpent: 0,
          hasData: false,
        });
      }

      setBudgetHistory(data);
      return;
    }

    const sortedItems = [...budgetItems].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    let cumulativeSpent = 0;

    for (let i = startMonth; i <= endMonth; i++) {
      // Get spending for THIS month only
      const monthItems = sortedItems.filter((item) => {
        const itemDate = new Date(item.createdAt);

        // Compare year and month ONLY (ignore timezone issues)
        const itemYear = itemDate.getFullYear();
        const itemMonth = itemDate.getMonth();

        const isInRange = itemYear === chartYear && itemMonth === i;
        return isInRange;
      });

      const monthSpent = monthItems.reduce(
        (sum, item) => sum + item.quantity * item.unitCost,
        0,
      );

      const hasData = monthItems.length > 0;
      cumulativeSpent += monthSpent;
      const remainingBudget = Math.max(0, totalBudget - cumulativeSpent);

      data.push({
        month: months[i],
        budget: Math.round(remainingBudget),
        spent: Math.round(cumulativeSpent),
        monthSpent: Math.round(monthSpent),
        hasData,
      });
    }

    setBudgetHistory(data);
  };

  const maxValue = Math.ceil(totalBudget * 1.2) || 100;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;

      if (!data.hasData && data.monthSpent === 0) {
        return (
          <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3">
            <div className="text-sm font-semibold mb-2">{data.month}</div>
            <div className="text-xs text-gray-500">
              No budget activity this month
            </div>
          </div>
        );
      }

      return (
        <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3">
          <div className="text-sm font-semibold mb-2">{data.month}</div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="text-gray-600">remaining:</span>
              <span className="font-medium">
                ₱{data.budget.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span className="text-gray-600">spent this month:</span>
              <span className="font-medium">
                ₱{data.monthSpent.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500"></div>
              <span className="text-gray-600">total spent:</span>
              <span className="font-medium">
                ₱{data.spent.toLocaleString()}
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
            Remaining: ₱{remaining.toLocaleString()} / ₱
            {totalBudget.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Total Spent: ₱{totalSpent.toLocaleString()}
          </p>
        </div>

        <div className="flex gap-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {[2024, 2025, 2026, 2027].map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {[
              "January",
              "February",
              "March",
              "April",
              "May",
              "June",
              "July",
              "August",
              "September",
              "October",
              "November",
              "December",
            ].map((month, index) => (
              <option key={index} value={index}>
                {month}
              </option>
            ))}
          </select>

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
      </div>

      <div className="flex items-center gap-6 mb-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-gray-600">Budget Remaining</span>
        </div>
      </div>

      {loading ? (
        <div className="h-[280px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : budgetHistory.length === 0 ? (
        <div className="h-[280px] flex items-center justify-center text-gray-500">
          No budget data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart
            data={budgetHistory}
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
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: "#e5e7eb" }}
            />
            <Line
              type="linear"
              dataKey="budget"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: "#3b82f6", r: 6, strokeWidth: 2, stroke: "#fff" }}
              activeDot={{ r: 8 }}
              connectNulls={true}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}