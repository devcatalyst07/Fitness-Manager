import React from "react";

// ========================================
// ACTIVITY ITEM COMPONENT
// ========================================
interface ActivityItemProps {
  type: "budget" | "task" | "approval" | "team" | "document" | "system";
  action: string;
  description: string;
  timestamp: string;
  userName?: string;
  metadata?: {
    severity?: "info" | "warning" | "critical";
  };
}

export function ActivityItem({
  type,
  action,
  description,
  timestamp,
  userName,
  metadata,
}: ActivityItemProps) {
  const getActivityIcon = (activityType: string, activityAction: string) => {
    // Budget activities
<<<<<<< HEAD
    if (activityType === "budget") return "🔔";

    // Task activities
    if (activityType === "task") {
      if (activityAction === "task_completed") return "🔔";
      return "📋";
=======
    if (activityType === "budget") return "";

    // Task activities
    if (activityType === "task") {
      if (activityAction === "task_completed") return "";
      return "";
>>>>>>> 46e120a604905e787c7812fc57e92f5da3479611
    }

    // Approval activities
    if (activityType === "approval") return "🟠";

    // Team activities
    if (activityType === "team") return "";

    // Document activities
    if (activityType === "document") return "";

    // System activities
    if (activityType === "system") {
      if (metadata?.severity === "critical") return "🔴";
      if (metadata?.severity === "warning") return "🟡";
      return "🔵";
    }

    return "";
  };

  const getActivityColor = (activityType: string, activityAction: string) => {
    // Budget - Blue
    if (activityType === "budget") return "bg-blue-100";

    // Task completed - Green
    if (activityAction === "task_completed") return "bg-green-100";

    // Approval - Orange
    if (activityType === "approval") return "bg-orange-100";

    // Team - Purple
    if (activityType === "team") return "bg-purple-100";

    // System alerts
    if (activityType === "system") {
      if (metadata?.severity === "critical") return "bg-red-100";
      if (metadata?.severity === "warning") return "bg-yellow-100";
      return "bg-blue-100";
    }

    return "bg-gray-100";
  };

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${getActivityColor(type, action)}`}
      >
        {getActivityIcon(type, action)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900">{description}</p>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-xs text-gray-500">{formatTimestamp(timestamp)}</p>
          {userName && (
            <>
              <span className="text-xs text-gray-400">•</span>
              <p className="text-xs text-gray-500">{userName}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ========================================
// ACTIVITY CONTAINER
// ========================================
interface ActivityContainerProps {
  activities: any[];
  loading?: boolean;
}

export function ActivityContainer({
  activities,
  loading,
}: ActivityContainerProps) {
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
         Recent Activity
        </h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex items-start gap-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
         Recent Activity
      </h3>

      {activities.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-4xl mb-2"></p>
          <p className="font-medium">No recent activity</p>
          <p className="text-sm mt-1">Project activity will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <ActivityItem
              key={activity._id}
              type={activity.type}
              action={activity.action}
              description={activity.description}
              timestamp={activity.createdAt}
              userName={activity.userName}
              metadata={activity.metadata}
            />
          ))}
        </div>
      )}
    </div>
  );
}
