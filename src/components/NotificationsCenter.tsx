"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/axios";

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}

type FilterTab = "all" | "unread" | "read";

interface NotificationsCenterProps {
  dashboardPath: string;
}

export default function NotificationsCenter({
  dashboardPath,
}: NotificationsCenterProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const tabLabels: Record<FilterTab, string> = {
    all: "All",
    unread: "Unread",
    read: "Read",
  };

  const fetchNotifications = async (filter: FilterTab) => {
    try {
      setLoading(true);
      const response = await apiClient.get(
        `/api/notifications/history?filter=${filter}&page=1&limit=0`,
      );

      if (response.success && response.data) {
        setNotifications(response.data.notifications || []);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error("Error fetching notification history:", error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(activeTab);
  }, [activeTab]);

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await apiClient.patch(`/api/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((notification) =>
          notification._id === notificationId
            ? { ...notification, isRead: true }
            : notification,
        ),
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await apiClient.delete(`/api/notifications/${notificationId}`);
      setNotifications((prev) =>
        prev.filter((notification) => notification._id !== notificationId),
      );
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const tabCounts = useMemo(
    () => ({
      all: notifications.length,
      unread: notifications.filter((notification) => !notification.isRead)
        .length,
      read: notifications.filter((notification) => notification.isRead).length,
    }),
    [notifications],
  );

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={() => {
            if (window.history.length > 1) {
              router.back();
              return;
            }
            router.push(dashboardPath);
          }}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          title="Back"
        >
          <ArrowLeft size={20} className="text-gray-700 dark:text-gray-200" />
        </button>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Notifications
        </h1>
      </div>

      <div className="mb-4 overflow-x-auto -mx-1 px-1">
        <div className="inline-flex min-w-max rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
          {(Object.keys(tabLabels) as FilterTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                activeTab === tab
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-300"
              }`}
            >
              {tabLabels[tab]}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3 text-xs text-gray-500 dark:text-gray-400">
        Showing {tabCounts[activeTab]} {tabLabels[activeTab].toLowerCase()}{" "}
        notifications
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No notifications found
          </div>
        ) : (
          notifications.map((notification, index) => (
            <div
              key={`${notification._id || `${notification.title}-${notification.createdAt}`}-${index}`}
              className={`p-4 border-b last:border-b-0 border-gray-200 dark:border-gray-700 ${
                !notification.isRead ? "bg-blue-50 dark:bg-blue-900/20" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  className="flex-1 text-left"
                  onClick={async () => {
                    if (!notification.isRead) {
                      await markAsRead(notification._id);
                    }

                    if (notification.actionUrl) {
                      router.push(notification.actionUrl);
                    }
                  }}
                >
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {notification.title}
                    </p>
                    {!notification.isRead && (
                      <span className="w-2 h-2 bg-blue-600 rounded-full" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatRelativeTime(notification.createdAt)}
                  </p>
                </button>
                <div className="flex items-center gap-2 self-start">
                  {!notification.isRead && (
                    <button
                      onClick={() => markAsRead(notification._id)}
                      className="p-1 text-gray-400 hover:text-blue-600"
                      title="Mark as read"
                    >
                      <Check size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification._id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
