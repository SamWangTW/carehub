"use client";

import { createContext, useContext, useMemo, useState } from "react";

type Toast = {
  id: string;
  message: string;
};

type ToastContextValue = {
  pushToast: (input: { id?: string; message: string }) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export default function ToastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const value = useMemo<ToastContextValue>(
    () => ({
      pushToast: ({ id, message }) => {
        const toastId =
          id ??
          `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        setToasts((prev) => [...prev, { id: toastId, message }]);
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== toastId));
        }, 3500);
      },
    }),
    []
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        data-testid="notif-toast-region"
        className="fixed right-4 top-4 z-50 flex w-80 flex-col gap-2"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            data-testid={`notif-toast-${t.id}`}
            className="rounded border border-neutral-700/70 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 shadow"
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
