"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Bell, X, Check } from "lucide-react";
import { apiClient } from "@/lib/axios";
import { usePathname, useRouter } from "next/navigation";

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string;
  metadata?: {
    userId?: string;
    userName?: string;
    userEmail?: string;
    [key: string]: any;
  };
  createdAt: string;
}

interface NotificationBellProps {
  onRoleRequestClick?: (userId: string) => void;
}

interface NotificationGroup {
  groupId: string;
  latest: Notification;
  items: Notification[];
  count: number;
  unreadCount: number;
}

interface NotificationToast {
  id: string;
  title: string;
  message: string;
  actionUrl?: string;
}

export default function NotificationBell({
  onRoleRequestClick,
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<NotificationToast[]>([]);
  const [toastEnabled, setToastEnabled] = useState(true);
  const [savingToastPref, setSavingToastPref] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const eventSourceRef = useRef<EventSource | null>(null);
  const toastTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const dashboardPath = pathname?.startsWith("/user")
    ? "/user/dashboard"
    : "/admin/dashboard";
  const notificationsPagePath = pathname?.startsWith("/user")
    ? "/user/notifications"
    : "/admin/notifications";

  const buildNotificationGroupKey = (notification: Notification) => {
    const metadata = notification.metadata || {};
    return [
      notification.type,
      metadata.activityAction || "",
      metadata.projectId || "",
      metadata.taskId || "",
      notification.title,
    ].join("|");
  };

  const groupedNotifications = useMemo<NotificationGroup[]>(() => {
    const groupsMap = new Map<string, NotificationGroup>();

    for (const notification of notifications) {
      const groupId = buildNotificationGroupKey(notification);
      const existingGroup = groupsMap.get(groupId);

      if (!existingGroup) {
        groupsMap.set(groupId, {
          groupId,
          latest: notification,
          items: [notification],
          count: 1,
          unreadCount: notification.isRead ? 0 : 1,
        });
        continue;
      }

      existingGroup.items.push(notification);
      existingGroup.count += 1;
      if (!notification.isRead) {
        existingGroup.unreadCount += 1;
      }

      if (
        new Date(notification.createdAt).getTime() >
        new Date(existingGroup.latest.createdAt).getTime()
      ) {
        existingGroup.latest = notification;
      }
    }

    return Array.from(groupsMap.values()).sort(
      (a, b) =>
        new Date(b.latest.createdAt).getTime() -
        new Date(a.latest.createdAt).getTime(),
    );
  }, [notifications]);

  const unreadGroupCount = useMemo(
    () => groupedNotifications.filter((group) => group.unreadCount > 0).length,
    [groupedNotifications],
  );

  const showToast = (notification: Notification) => {
    const toastId = `toast-${notification._id}`;

    setToasts((prev) => {
      if (prev.some((toast) => toast.id === toastId)) {
        return prev;
      }

      return [
        {
          id: toastId,
          title: notification.title,
          message: notification.message,
          actionUrl: notification.actionUrl,
        },
        ...prev,
      ].slice(0, 3);
    });

    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== toastId));
      toastTimersRef.current.delete(toastId);
    }, 5000);

    toastTimersRef.current.set(toastId, timer);
  };

  const dismissToast = (toastId: string) => {
    const timer = toastTimersRef.current.get(toastId);
    if (timer) {
      clearTimeout(timer);
      toastTimersRef.current.delete(toastId);
    }
    setToasts((prev) => prev.filter((toast) => toast.id !== toastId));
  };

  const fetchToastPreference = async () => {
    try {
      const response = await apiClient.get(
        "/api/profile/preferences/notifications",
      );

      if (typeof response.notificationToastEnabled === "boolean") {
        setToastEnabled(response.notificationToastEnabled);
      }
    } catch (error) {
      console.error("Error fetching toast preference:", error);
    }
  };

  const toggleToastPreference = async () => {
    const nextValue = !toastEnabled;

    try {
      setSavingToastPref(true);
      setToastEnabled(nextValue);

      await apiClient.put("/api/profile/preferences/notifications", {
        notificationToastEnabled: nextValue,
      });
    } catch (error) {
      setToastEnabled((prev) => !prev);
      console.error("Error updating toast preference:", error);
    } finally {
      setSavingToastPref(false);
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      console.log("🔔 Fetching notifications...");
      const response = await apiClient.get("/api/notifications");

      console.log("🔔 Full response object:", response);
      console.log("🔔 Response type:", typeof response);
      console.log("🔔 Response keys:", Object.keys(response));

      // apiClient.get already extracts res.data, so response IS the data
      // Backend returns: { success: true, data: { notifications, unreadCount } }
      // After apiClient extraction: { success: true, data: { notifications, unreadCount } }
      if (response.success && response.data) {
        setNotifications(response.data.notifications || []);
        setUnreadCount(response.data.unreadCount || 0);
        console.log(
          "✅ Notifications set:",
          response.data.notifications?.length || 0,
          "total,",
          response.data.unreadCount || 0,
          "unread",
        );
      } else if (response.notifications) {
        // Fallback if structure is different
        setNotifications(response.notifications || []);
        setUnreadCount(response.unreadCount || 0);
        console.log(
          "✅ Notifications set (alt format):",
          response.notifications?.length || 0,
          "total,",
          response.unreadCount || 0,
          "unread",
        );
      }
    } catch (error) {
      console.error("❌ Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      await apiClient.patch(`/api/notifications/${notificationId}/read`);

      // Update local state
      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === notificationId ? { ...notif, isRead: true } : notif,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await apiClient.patch("/api/notifications/read-all");

      // Update local state
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, isRead: true })),
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    try {
      await apiClient.delete(`/api/notifications/${notificationId}`);

      // Update local state
      const notif = notifications.find((n) => n._id === notificationId);
      if (notif && !notif.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      setNotifications((prev) =>
        prev.filter((notif) => notif._id !== notificationId),
      );
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const markGroupAsRead = async (group: NotificationGroup) => {
    const unreadNotifications = group.items.filter(
      (notification) => !notification.isRead,
    );

    if (unreadNotifications.length === 0) {
      return;
    }

    try {
      await Promise.allSettled(
        unreadNotifications.map((notification) =>
          apiClient.patch(`/api/notifications/${notification._id}/read`),
        ),
      );

      const unreadIds = new Set(
        unreadNotifications.map((notification) => notification._id),
      );

      setNotifications((prev) =>
        prev.map((notification) =>
          unreadIds.has(notification._id)
            ? { ...notification, isRead: true }
            : notification,
        ),
      );

      setUnreadCount((prev) => Math.max(0, prev - unreadNotifications.length));
    } catch (error) {
      console.error("Error marking notification group as read:", error);
    }
  };

  const deleteGroupNotifications = async (group: NotificationGroup) => {
    try {
      await Promise.allSettled(
        group.items.map((notification) =>
          apiClient.delete(`/api/notifications/${notification._id}`),
        ),
      );

      const deleteIds = new Set(
        group.items.map((notification) => notification._id),
      );

      setNotifications((prev) =>
        prev.filter((notification) => !deleteIds.has(notification._id)),
      );
      setUnreadCount((prev) => Math.max(0, prev - group.unreadCount));
    } catch (error) {
      console.error("Error deleting notification group:", error);
    }
  };

  const handleGroupClick = async (group: NotificationGroup) => {
    if (group.unreadCount > 0) {
      await markGroupAsRead(group);
    }

    const targetNotification = group.latest;

    if (
      targetNotification.type === "role_request" &&
      targetNotification.metadata?.userId
    ) {
      setIsOpen(false);

      if (onRoleRequestClick) {
        onRoleRequestClick(targetNotification.metadata.userId);
      } else if (targetNotification.actionUrl) {
        router.push(targetNotification.actionUrl);
      }
      return;
    }

    if (targetNotification.actionUrl) {
      setIsOpen(false);
      router.push(targetNotification.actionUrl);
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }

    // Handle role request notifications specially
    if (notification.type === "role_request" && notification.metadata?.userId) {
      setIsOpen(false);

      // If callback provided, use it (for opening access control modal)
      if (onRoleRequestClick) {
        onRoleRequestClick(notification.metadata.userId);
      } else if (notification.actionUrl) {
        router.push(notification.actionUrl);
      }
    } else if (notification.actionUrl) {
      setIsOpen(false);
      router.push(notification.actionUrl);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Fetch unread count on mount and periodically
  useEffect(() => {
    fetchNotifications();
    fetchToastPreference();

    // Poll for new notifications every 60 seconds
    const interval = setInterval(() => {
      fetchNotifications();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => {
      for (const timer of toastTimersRef.current.values()) {
        clearTimeout(timer);
      }
      toastTimersRef.current.clear();
    };
  }, []);

  // Live notification stream with polling fallback still enabled
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const apiBaseUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const streamUrl = `${apiBaseUrl}/api/notifications/stream`;

    const eventSource = new EventSource(streamUrl, { withCredentials: true });
    eventSourceRef.current = eventSource;

    eventSource.addEventListener("connected", (event) => {
      try {
        const payload = JSON.parse((event as MessageEvent).data);
        if (typeof payload.unreadCount === "number") {
          setUnreadCount(payload.unreadCount);
        }
      } catch (error) {
        console.error("Notification stream connect parse error:", error);
      }
    });

    eventSource.addEventListener("notification:new", (event) => {
      try {
        const payload = JSON.parse((event as MessageEvent).data);
        const incomingNotification = payload.notification as Notification;

        if (!incomingNotification?._id) {
          return;
        }

        setNotifications((prev) => {
          const exists = prev.some(
            (notification) => notification._id === incomingNotification._id,
          );

          if (exists) {
            return prev;
          }

          return [incomingNotification, ...prev].slice(0, 50);
        });

        setUnreadCount((prev) => prev + 1);

        if (!isOpen && toastEnabled) {
          showToast(incomingNotification);
        }
      } catch (error) {
        console.error("Notification stream message parse error:", error);
      }
    });

    eventSource.addEventListener("notification:read", (event) => {
      try {
        const payload = JSON.parse((event as MessageEvent).data);
        const notificationId = payload.notification?._id;

        if (notificationId) {
          setNotifications((prev) =>
            prev.map((notification) =>
              notification._id === notificationId
                ? { ...notification, isRead: true }
                : notification,
            ),
          );
        }

        if (typeof payload.unreadCount === "number") {
          setUnreadCount(payload.unreadCount);
        }
      } catch (error) {
        console.error("Notification read event parse error:", error);
      }
    });

    eventSource.addEventListener("notification:read-all", (event) => {
      try {
        const payload = JSON.parse((event as MessageEvent).data);
        setNotifications((prev) =>
          prev.map((notification) => ({ ...notification, isRead: true })),
        );
        setUnreadCount(
          typeof payload.unreadCount === "number" ? payload.unreadCount : 0,
        );
      } catch (error) {
        console.error("Notification read-all event parse error:", error);
      }
    });

    eventSource.addEventListener("notification:deleted", (event) => {
      try {
        const payload = JSON.parse((event as MessageEvent).data);
        const notificationId = payload.notification?._id;

        if (notificationId) {
          setNotifications((prev) =>
            prev.filter((notification) => notification._id !== notificationId),
          );
        }

        if (typeof payload.unreadCount === "number") {
          setUnreadCount(payload.unreadCount);
        }
      } catch (error) {
        console.error("Notification delete event parse error:", error);
      }
    });

    eventSource.onerror = () => {
      console.warn(
        "Notification stream disconnected; polling fallback remains active",
      );
    };

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [isOpen, toastEnabled]);

  // Format relative time
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

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="fixed top-4 right-4 z-[60] space-y-2 w-80">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3"
          >
            <div className="flex items-start gap-2">
              <button
                onClick={() => {
                  dismissToast(toast.id);
                  if (toast.actionUrl) {
                    router.push(toast.actionUrl);
                  }
                }}
                className="flex-1 text-left"
              >
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {toast.title}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mt-1">
                  {toast.message}
                </p>
              </button>
              <button
                onClick={() => dismissToast(toast.id)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                title="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
      >
        <Bell size={20} />
        {unreadGroupCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
            {unreadGroupCount > 9 ? "9+" : unreadGroupCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-[600px] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Notifications
            </h3>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleToastPreference}
                disabled={savingToastPref}
                className="text-xs px-2 py-1 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                title="Enable or disable toast popups"
              >
                Toasts: {toastEnabled ? "On" : "Off"}
              </button>

              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Notifications list */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                Loading...
              </div>
            ) : groupedNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                No notifications
              </div>
            ) : (
              groupedNotifications.map((group) => (
                <div
                  key={group.groupId}
                  className={`p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    group.unreadCount > 0
                      ? "bg-blue-50 dark:bg-blue-900/20"
                      : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() => handleGroupClick(group)}
                        className="w-full text-left"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
                            {group.latest.title}
                          </h4>
                          {group.count > 1 && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                              {group.count}
                            </span>
                          )}
                          {group.unreadCount > 0 && (
                            <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                          {group.latest.message}
                          {group.count > 1 && (
                            <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                              (+{group.count - 1} similar)
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {formatRelativeTime(group.latest.createdAt)}
                        </p>
                      </button>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {group.unreadCount > 0 && (
                        <button
                          onClick={() => markGroupAsRead(group)}
                          className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          title="Mark as read"
                        >
                          <Check size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => deleteGroupNotifications(group)}
                        className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {groupedNotifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-center">
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push(notificationsPagePath);
                }}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
