import { test, expect } from "@playwright/test";

test.describe("patient flows", () => {
  test("edit patient flow updates header", async ({ page }) => {
    await page.goto("/patients/pat-001?tab=overview");

    await page.getByTestId("edit-patient-open").click();
    await expect(page.getByTestId("edit-patient-modal")).toBeVisible();

    const firstNameInput = page.getByTestId("edit-patient-first-name");
    await firstNameInput.fill("");
    await page.getByTestId("edit-patient-save").click();
    await expect(page.getByText("First name is required.")).toBeVisible();

    await firstNameInput.fill("Testy");
    await page.getByTestId("edit-patient-save").click();

    await expect(page.getByTestId("edit-patient-modal")).toBeHidden();
    await expect(page.getByTestId("patient-header-name")).toContainText(
      "Testy"
    );
  });

  test("patient notes optimistic add", async ({ page }) => {
    await page.goto("/patients/pat-001?tab=notes");

    const input = page.getByTestId("patient-note-input");
    await input.fill("**E2E Bold Note**");
    await page.getByTestId("patient-note-submit").click();

    await expect(page.getByTestId("patient-notes-list")).toContainText(
      "E2E Bold Note"
    );
    await expect(page.locator("strong", { hasText: "E2E Bold Note" })).toBeVisible();

    await page.reload();
    await expect(page.getByTestId("patient-notes-list")).toContainText(
      "E2E Bold Note"
    );
    await expect(page.locator("strong", { hasText: "E2E Bold Note" })).toBeVisible();
  });
});
