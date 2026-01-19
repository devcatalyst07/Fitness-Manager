import React from "react";
import { AlertCircle, AlertTriangle, Info, ChevronRight } from "lucide-react";

// ========================================
// INSIGHT CARD COMPONENT
// ========================================
interface InsightCardProps {
  insight: {
    _id: string;
    type: "action" | "warning" | "info";
    severity: "critical" | "warning" | "info";
    category: "tasks" | "budget" | "team" | "approvals";
    title: string;
    description: string;
    count: number;
    recommendation: string;
    actionLabel: string;
    actionUrl: string;
  };
  onAction: (url: string) => void;
}

export function InsightCard({ insight, onAction }: InsightCardProps) {
  const getSeverityConfig = () => {
    switch (insight.severity) {
      case "critical":
        return {
          icon: AlertCircle,
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          textColor: "text-red-700",
          iconColor: "text-red-600",
          badgeColor: "bg-red-100 text-red-700",
        };
      case "warning":
        return {
          icon: AlertTriangle,
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
          textColor: "text-yellow-700",
          iconColor: "text-yellow-600",
          badgeColor: "bg-yellow-100 text-yellow-700",
        };
      default:
        return {
          icon: Info,
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          textColor: "text-blue-700",
          iconColor: "text-blue-600",
          badgeColor: "bg-blue-100 text-blue-700",
        };
    }
  };

  const config = getSeverityConfig();
  const Icon = config.icon;

  // const getCategoryEmoji = () => {
  //   switch (insight.category) {
  //     case "tasks":
  //       return "📋";
  //     case "budget":
  //       return "💰";
  //     case "team":
  //       return "👥";
  //     case "approvals":
  //       return "✓";
  //     default:
  //       return "💡";
  //   }
  // };

  return (
    <div
      className={`border rounded-lg p-4 ${config.bgColor} ${config.borderColor} hover:shadow-md transition-shadow`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className={`p-2 rounded-lg ${config.iconColor} bg-white`}>
            <Icon size={20} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg"></span>
              <h4 className="font-semibold text-gray-900">{insight.title}</h4>
              {insight.count > 0 && (
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.badgeColor}`}
                >
                  {insight.count}
                </span>
              )}
            </div>

            <p className="text-sm text-gray-700 mb-2">{insight.description}</p>

            <p className={`text-xs italic ${config.textColor} mb-3`}>
             {insight.recommendation}
            </p>

            <button
              onClick={() => onAction(insight.actionUrl)}
              className={`inline-flex items-center gap-1 text-sm font-medium ${config.textColor} hover:underline`}
            >
              {insight.actionLabel}
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========================================
// INSIGHTS CONTAINER
// ========================================
interface InsightsContainerProps {
  insights: any[];
  onAction: (url: string) => void;
  onRefresh: () => void;
}

export function InsightsContainer({
  insights,
  onAction,
  onRefresh,
}: InsightsContainerProps) {
  const criticalCount = insights.filter(
    (i) => i.severity === "critical",
  ).length;
  const warningCount = insights.filter((i) => i.severity === "warning").length;
  const infoCount = insights.filter((i) => i.severity === "info").length;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
             Project Insights
          </h3>
          {insights.length > 0 && (
            <div className="flex items-center gap-2">
              {criticalCount > 0 && (
                <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-medium">
                  {criticalCount} Critical
                </span>
              )}
              {warningCount > 0 && (
                <span className="bg-yellow-100 text-yellow-600 text-xs px-2 py-0.5 rounded-full font-medium">
                  {warningCount} Warning
                </span>
              )}
              {infoCount > 0 && (
                <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full font-medium">
                  {infoCount} Info
                </span>
              )}
            </div>
          )}
        </div>
        <button
          onClick={onRefresh}
          className="text-sm text-gray-600 hover:text-black flex items-center gap-1"
        >
           Refresh
        </button>
      </div>

      {insights.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-4xl mb-2"></p>
          <p className="font-medium">No insights - All systems nominal!</p>
          <p className="text-sm mt-1">
            Your project is on track with no issues detected
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {insights.map((insight) => (
            <InsightCard
              key={insight._id}
              insight={insight}
              onAction={onAction}
            />
          ))}
        </div>
      )}
    </div>
  );
}
