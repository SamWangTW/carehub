import { test, expect } from "@playwright/test";

test("scheduler reschedule flow opens confirm", async ({ page }) => {
  await page.goto("/schedule");

  const appt = page.locator('[data-testid^="schedule-appt-"]').first();
  await expect(appt).toBeVisible();

  const target = page.getByTestId("schedule-cell-0-2-prov-001");
  await target.scrollIntoViewIfNeeded();
  await appt.dragTo(target);

  await expect(page.getByTestId("schedule-confirm-modal")).toBeVisible();

  const conflict = page.getByTestId("schedule-conflict-warning");
  if (await conflict.isVisible()) {
    await expect(conflict).toBeVisible();
  }

  await page.getByTestId("schedule-confirm-submit").click();
  await expect(page.getByTestId("schedule-confirm-modal")).toBeHidden();
});
