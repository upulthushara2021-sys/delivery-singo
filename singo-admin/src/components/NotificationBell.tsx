import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { API_BASE_URL } from "../api/axios";

type NotificationItem = {
  id: number;
  title: string;
  message: string;
  type: string;
  deliveryId?: number;
  isRead: boolean;
  createdAt: string;
};

export default function NotificationBell() {
  const { token, user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const seenNotificationIds = useRef<Set<number>>(new Set());
  const pendingReadIds = useRef<Set<number>>(new Set());

  const loadNotifications = useCallback(async () => {
    if (!token || !user) return;

    try {
      setLoading(true);
      const [listResponse, countResponse] = await Promise.all([
        api.get<NotificationItem[]>("/notifications"),
        api.get<number>("/notifications/unread-count"),
      ]);

      const loadedNotifications = Array.isArray(listResponse.data)
        ? listResponse.data
        : [];

      loadedNotifications.forEach((item) => {
        seenNotificationIds.current.add(item.id);
      });

      setNotifications((current) => {
        const existingIds = new Set(loadedNotifications.map((item) => item.id));
        const liveOnly = current.filter((item) => !existingIds.has(item.id));

        return [...liveOnly, ...loadedNotifications].slice(0, 50);
      });

      setUnreadCount(Number(countResponse.data) || 0);
    } catch (error) {
      console.error("Unable to load notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    if (!token || !user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    void loadNotifications();

    const socket = io(API_BASE_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
    });

    socket.on("notification", (incoming: NotificationItem) => {
      if (seenNotificationIds.current.has(incoming.id)) return;

      seenNotificationIds.current.add(incoming.id);

      setNotifications((current) => [incoming, ...current].slice(0, 50));

      if (!incoming.isRead) {
        setUnreadCount((count) => count + 1);
      }
    });

    socket.on("connect_error", (error) => {
      console.error("Notification connection error:", error.message);
    });

    return () => {
      socket.disconnect();
    };
  }, [token, user, loadNotifications]);

  const markAsRead = async (id: number) => {
    const notification = notifications.find((item) => item.id === id);

    if (
      !notification ||
      notification.isRead ||
      pendingReadIds.current.has(id)
    ) {
      return;
    }

    pendingReadIds.current.add(id);
    try {
      await api.patch(`/notifications/${id}/read`);

      setNotifications((current) =>
        current.map((item) =>
          item.id === id ? { ...item, isRead: true } : item,
        ),
      );

      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (error) {
      console.error("Unable to mark notification as read:", error);
    } finally {
      pendingReadIds.current.delete(id);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifications((current) =>
        current.map((item) => ({ ...item, isRead: true })),
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Unable to mark all notifications as read:", error);
    }
  };

  const formatDate = (value: string) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? ""
      : date.toLocaleString();
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="relative rounded-lg p-2 transition hover:bg-gray-100 dark:hover:bg-slate-800"
        title="Notifications"
        aria-label={`Notifications, ${unreadCount} unread`}
        aria-expanded={isOpen}
      >
        <Bell size={20} className="text-gray-700 dark:text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-3 w-[min(90vw,24rem)] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-slate-700">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Notifications
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {unreadCount} unread
              </p>
            </div>

            <button
              type="button"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40 dark:text-blue-400"
            >
              <CheckCheck size={15} />
              Mark all read
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <p className="p-5 text-center text-sm text-gray-500">
                Loading notifications...
              </p>
            ) : notifications.length === 0 ? (
              <p className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                You're all caught up.
              </p>
            ) : (
              notifications.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => {
                    if (!item.isRead) void markAsRead(item.id);
                  }}
                  className={`block w-full border-b border-gray-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-gray-50 dark:border-slate-800 dark:hover:bg-slate-800 ${
                    item.isRead
                      ? "bg-white dark:bg-slate-900"
                      : "bg-blue-50/70 dark:bg-blue-950/30"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!item.isRead && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {item.title}
                      </p>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                        {item.message}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        {formatDate(item.createdAt)}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}