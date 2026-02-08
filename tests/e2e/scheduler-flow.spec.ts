import { test, expect } from "@playwright/test";

test("scheduler reschedule flow opens confirm", async ({ page }) => {
  await page.goto("/schedule");

  const appt = page.locator('[data-testid^="schedule-appt-"]').first();
  await expect(appt).toBeVisible();
  await appt.scrollIntoViewIfNeeded();

  const target = page.getByTestId("schedule-cell-0-2-prov-001");
  await target.scrollIntoViewIfNeeded();

  await page.evaluate(() => {
    const source = document.querySelector('[data-testid^="schedule-appt-"]');
    const target = document.querySelector(
      '[data-testid="schedule-cell-0-2-prov-001"]'
    );
    if (!source || !target) return;

    const dataTransfer = new DataTransfer();
    source.dispatchEvent(
      new DragEvent("dragstart", { bubbles: true, dataTransfer })
    );
    target.dispatchEvent(
      new DragEvent("dragover", { bubbles: true, dataTransfer })
    );
    target.dispatchEvent(
      new DragEvent("drop", { bubbles: true, dataTransfer })
    );
    source.dispatchEvent(
      new DragEvent("dragend", { bubbles: true, dataTransfer })
    );
  });

  await expect(page.getByTestId("schedule-confirm-modal")).toBeVisible();

  const conflict = page.getByTestId("schedule-conflict-warning");
  if (await conflict.isVisible()) {
    await expect(conflict).toBeVisible();
  }

  await page.getByTestId("schedule-confirm-submit").click();
  await expect(page.getByTestId("schedule-confirm-modal")).toBeHidden();
});
