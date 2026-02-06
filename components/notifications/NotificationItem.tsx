"use client";

import type { Notification } from "../../types/notification";

const typeLabel: Record<Notification["type"], string> = {
  appointment: "Appointment",
  patient_alert: "Patient Alert",
  message: "Message",
};

const typeIcon: Record<Notification["type"], string> = {
  appointment: "📅",
  patient_alert: "⚠️",
  message: "💬",
};

export default function NotificationItem({
  notification,
  onMarkRead,
}: {
  notification: Notification;
  onMarkRead: () => void;
}) {
  const isRead = Boolean(notification.readAt);

  return (
    <div
      className={`flex gap-3 rounded border px-3 py-2 ${
        isRead
          ? "border-neutral-800 bg-neutral-950 text-neutral-300"
          : "border-neutral-700/70 bg-neutral-900 text-neutral-100"
      }`}
    >
      <div className="text-lg leading-none">{typeIcon[notification.type]}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="truncate font-medium">{notification.title}</div>
          {!isRead && (
            <button
              onClick={onMarkRead}
              className="text-xs text-blue-300 hover:underline"
            >
              Mark read
            </button>
          )}
        </div>
        <div className="text-xs text-neutral-400">
          {typeLabel[notification.type]} •{" "}
          {new Date(notification.createdAt).toLocaleString()}
        </div>
        {notification.body && (
          <div className="mt-1 text-sm text-neutral-200 line-clamp-2">
            {notification.body}
          </div>
        )}
      </div>
    </div>
  );
}
