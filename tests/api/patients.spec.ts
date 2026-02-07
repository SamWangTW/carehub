import { test, expect } from "@playwright/test";

test.describe("patients API", () => {
  test("GET /api/patients returns paginated data", async ({ request }) => {
    const res = await request.get("/api/patients?limit=10&page=1");
    expect(res.ok()).toBeTruthy();
    const json = await res.json();

    expect(Array.isArray(json.data)).toBeTruthy();
    expect(json.data.length).toBeGreaterThan(0);
    expect(json.pagination).toBeTruthy();
    expect(json.pagination.page).toBe(1);
  });

  test("GET /api/patients/:id returns a patient", async ({ request }) => {
    const res = await request.get("/api/patients/pat-001");
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.id).toBe("pat-001");
  });

  test("PUT /api/patients/:id updates patient", async ({ request }) => {
    const getRes = await request.get("/api/patients/pat-001");
    expect(getRes.ok()).toBeTruthy();
    const original = await getRes.json();

    const updateRes = await request.put("/api/patients/pat-001", {
      data: { firstName: "Testy" },
    });
    expect(updateRes.ok()).toBeTruthy();
    const updated = await updateRes.json();
    expect(updated.firstName).toBe("Testy");

    await request.put("/api/patients/pat-001", {
      data: { firstName: original.firstName },
    });
  });

  test("POST /api/patients/:id/notes creates a note", async ({ request }) => {
    const res = await request.post("/api/patients/pat-001/notes", {
      data: { text: "Test note from API", author: "E2E" },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.patientId).toBe("pat-001");
    expect(json.text).toBe("Test note from API");
  });
});
