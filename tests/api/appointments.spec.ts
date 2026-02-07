import { test, expect } from "@playwright/test";

test("GET /api/appointments filters by range", async ({ request }) => {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - 3);
  const end = new Date(now);
  end.setDate(now.getDate() + 10);

  const res = await request.get(
    `/api/appointments?start=${start.toISOString()}&end=${end.toISOString()}`
  );
  expect(res.ok()).toBeTruthy();
  const json = await res.json();
  expect(Array.isArray(json.data)).toBeTruthy();
});
