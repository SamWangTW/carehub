import { test, expect } from "@playwright/test";

test.describe("notifications toasts", () => {
  test("no toast on initial load", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("notif-toast-region")).toBeVisible();
    const toasts = page.locator(
      '[data-testid^="notif-toast-"]:not([data-testid="notif-toast-region"])'
    );
    await expect(toasts).toHaveCount(0);
  });

  test("toast appears for new arrival after initial load", async ({ page, request }) => {
    await page.goto("/");
    const toasts = page.locator(
      '[data-testid^="notif-toast-"]:not([data-testid="notif-toast-region"])'
    );
    await expect(toasts).toHaveCount(0);

    const res = await request.post("/api/notifications/debug/emit", {
      data: {
        type: "patient-alert",
        title: "E2E Alert",
        body: "Vitals spike detected.",
        href: "/patients/pat-001?tab=vitals",
      },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    const id = json.data.id as string;

    await expect
      .poll(async () => page.getByTestId(`notif-toast-${id}`).count(), {
        timeout: 5000,
      })
      .toBe(1);
  });

  test("no duplicate toast on subsequent polls", async ({ page, request }) => {
    await page.goto("/");
    const toasts = page.locator(
      '[data-testid^="notif-toast-"]:not([data-testid="notif-toast-region"])'
    );
    await expect(toasts).toHaveCount(0);

    const res = await request.post("/api/notifications/debug/emit", {
      data: {
        type: "message",
        title: "E2E Message",
        body: "Test toast dedupe.",
      },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    const id = json.data.id as string;

    await expect
      .poll(async () => page.getByTestId(`notif-toast-${id}`).count(), {
        timeout: 5000,
      })
      .toBe(1);

    await page.waitForTimeout(800);
    await expect(page.getByTestId(`notif-toast-${id}`)).toHaveCount(1);
  });
});
