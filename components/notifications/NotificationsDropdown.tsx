"use client";

import type { Notification } from "../../types/notification";
import NotificationItem from "./NotificationItem";

export default function NotificationsDropdown({
  items,
  onMarkRead,
  onMarkAll,
  busy,
}: {
  items: Notification[];
  onMarkRead: (id: string) => void;
  onMarkAll: () => void;
  busy: boolean;
}) {
  return (
    <div className="absolute right-0 mt-2 w-80 rounded border border-neutral-700/70 bg-neutral-950 shadow-lg">
      <div className="flex items-center justify-between border-b border-neutral-800 px-3 py-2">
        <div className="text-sm font-semibold text-neutral-100">
          Notifications
        </div>
        <button
          onClick={onMarkAll}
          disabled={busy}
          className={`text-xs ${
            busy ? "text-neutral-500" : "text-blue-300 hover:underline"
          }`}
        >
          Mark all read
        </button>
      </div>
      <div className="max-h-[360px] space-y-2 overflow-auto p-3">
        {items.length === 0 ? (
          <div className="text-sm text-neutral-400">No notifications.</div>
        ) : (
          items.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              onMarkRead={() => onMarkRead(n.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
