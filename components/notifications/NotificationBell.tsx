"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import useSWR, { mutate } from "swr";
import type {
  Notification,
  NotificationsResponse,
} from "../../types/notification";
import {
  notificationSchema,
  notificationsResponseSchema,
} from "../../types/notification";
import NotificationsDropdown from "./NotificationsDropdown";
import { useToast } from "./ToastProvider";

const READ_KEY = "carehub_notification_read";
const SEEN_KEY = "carehub_notification_seen";

function readReadMap(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(READ_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function writeReadMap(map: Record<string, string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(READ_KEY, JSON.stringify(map));
}

function readSeenSet(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function writeSeenSet(set: Set<string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SEEN_KEY, JSON.stringify(Array.from(set)));
}

async function fetcher(url: string): Promise<Notification[]> {
  const res = await fetch(url);
  const json = (await res.json()) as NotificationsResponse;
  const parsed = notificationsResponseSchema.parse(json);

  const readMap = readReadMap();
  return parsed.data.map((n) =>
    notificationSchema.parse({
      ...n,
      readAt: readMap[n.id] ?? n.readAt ?? null,
    })
  );
}

export default function NotificationBell() {
  const { pushToast } = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const initialized = useRef(false);

  const pollMs = Number(process.env.NEXT_PUBLIC_NOTIF_POLL_MS ?? 10000);

  const { data = [] } = useSWR("/api/notifications", fetcher, {
    refreshInterval: pollMs,
    revalidateOnFocus: true,
  });

  const unreadCount = useMemo(
    () => data.filter((n) => !n.readAt).length,
    [data]
  );

  const sorted = useMemo(
    () =>
      [...data].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [data]
  );

  useEffect(() => {
    const seen = readSeenSet();
    if (!initialized.current) {
      sorted.forEach((n) => seen.add(n.id));
      writeSeenSet(seen);
      initialized.current = true;
      return;
    }

    const newOnes = sorted.filter((n) => !seen.has(n.id));
    if (newOnes.length > 0) {
      newOnes.forEach((n) => {
        pushToast({ id: n.id, message: n.title });
        seen.add(n.id);
      });
      writeSeenSet(seen);
    }
  }, [sorted, pushToast]);

  async function markRead(id: string) {
    if (busy) return;
    setBusy(true);

    const readAt = new Date().toISOString();
    const readMap = readReadMap();
    readMap[id] = readAt;
    writeReadMap(readMap);

    mutate(
      "/api/notifications",
      data.map((n) => (n.id === id ? { ...n, readAt } : n)),
      false
    );

    await fetch(`/api/notifications/${id}/read`, { method: "POST" });
    mutate("/api/notifications");
    setBusy(false);
  }

  async function markAllRead() {
    if (busy) return;
    setBusy(true);

    const readAt = new Date().toISOString();
    const readMap = readReadMap();
    data.forEach((n) => {
      readMap[n.id] = readAt;
    });
    writeReadMap(readMap);

    mutate(
      "/api/notifications",
      data.map((n) => ({ ...n, readAt })),
      false
    );

    await fetch("/api/notifications/mark-all-read", { method: "POST" });
    mutate("/api/notifications");
    setBusy(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        data-testid="notif-bell-button"
        className="relative inline-flex h-9 w-9 items-center justify-center rounded border border-neutral-700/70 bg-neutral-900 text-neutral-100 hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        aria-label="Notifications"
      >
        🔔
        <span
          data-testid="notif-unread-badge"
          className="absolute -top-1 -right-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white"
        >
          {unreadCount}
        </span>
      </button>

      {open && (
        <NotificationsDropdown
          items={sorted}
          onMarkRead={markRead}
          onMarkAll={markAllRead}
          busy={busy}
        />
      )}
    </div>
  );
}
