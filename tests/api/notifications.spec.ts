import { test, expect } from "@playwright/test";

test("GET /api/notifications returns data", async ({ request }) => {
  const res = await request.get("/api/notifications");
  expect(res.ok()).toBeTruthy();
  const json = await res.json();
  expect(Array.isArray(json.data)).toBeTruthy();
});
