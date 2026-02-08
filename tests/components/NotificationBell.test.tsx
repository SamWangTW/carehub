import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SWRConfig } from "swr";
import NotificationBell from "../../components/notifications/NotificationBell";
import type { Notification } from "../../types/notification";

const notifications: Notification[] = [
  {
    id: "notif-1",
    type: "appointment",
    title: "Appointment updated",
    body: "Dr. Chen moved a visit to 2:30 PM.",
    createdAt: new Date().toISOString(),
    readAt: null,
  },
  {
    id: "notif-2",
    type: "message",
    title: "New message",
    body: "Front desk: Patient asked to reschedule.",
    createdAt: new Date().toISOString(),
    readAt: new Date().toISOString(),
  },
];

vi.mock("../../components/notifications/ToastProvider", () => ({
  useToast: () => ({
    pushToast: vi.fn(),
  }),
}));

const fetchJsonWithRetry = vi.fn(async (url: string, options?: RequestInit) => {
  if (url.startsWith("/api/notifications")) {
    if (options?.method === "POST") return {};
    return { data: notifications };
  }
  return {};
});

vi.mock("../../lib/http", () => ({
  fetchJsonWithRetry: (...args: [string, RequestInit?, unknown?]) =>
    fetchJsonWithRetry(...args),
}));

function renderBell() {
  return render(
    <SWRConfig
      value={{
        dedupingInterval: 0,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      }}
    >
      <NotificationBell />
    </SWRConfig>
  );
}

describe("NotificationBell (component)", () => {
  beforeEach(() => {
    fetchJsonWithRetry.mockClear();
    localStorage.clear();
  });
  afterEach(() => {
    cleanup();
  });

  it("renders unread count badge when unread notifications exist", async () => {
    const { container } = renderBell();
    const scope = within(container);

    await waitFor(() => {
      expect(scope.getByTestId("notif-unread-badge")).toHaveTextContent("1");
    });
  });

  it("opens dropdown on bell click", async () => {
    const { container } = renderBell();
    const scope = within(container);

    await userEvent.click(scope.getByTestId("notif-bell-button"));
    expect(scope.getByTestId("notif-dropdown")).toBeInTheDocument();
  });

  it("mark read clears unread count", async () => {
    const { container } = renderBell();
    const scope = within(container);

    await waitFor(() => {
      expect(scope.getByTestId("notif-unread-badge")).toHaveTextContent("1");
    });

    await userEvent.click(scope.getByTestId("notif-bell-button"));
    await userEvent.click(scope.getByText("Mark read"));

    await waitFor(() => {
      expect(scope.getByTestId("notif-unread-badge")).toHaveTextContent("0");
    });
  });
});
