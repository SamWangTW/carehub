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

test.describe.serial("appointments lifecycle", () => {
  let createdId = "";
  let providerId = "";
  let patientId = "";

  test.beforeAll(async ({ request }) => {
    const providersRes = await request.get("/api/providers");
    expect(providersRes.ok()).toBeTruthy();
    const providersJson = await providersRes.json();
    providerId = providersJson.data?.[0]?.id;
    expect(providerId).toBeTruthy();

    const patientsRes = await request.get("/api/patients?limit=1&page=1");
    expect(patientsRes.ok()).toBeTruthy();
    const patientsJson = await patientsRes.json();
    patientId = patientsJson.data?.[0]?.id;
    expect(patientId).toBeTruthy();
  });

  test("POST /api/appointments creates appointment", async ({ request }) => {
    const start = new Date();
    start.setHours(10, 0, 0, 0);
    const end = new Date(start.getTime() + 60 * 60000);

    const payload = {
      providerId,
      patientId,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      room: "Room 101",
      status: "scheduled",
    };

    const res = await request.post("/api/appointments", { data: payload });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.id).toBeTruthy();
    createdId = json.id;

    expect(json.providerId).toBe(payload.providerId);
    expect(json.patientId).toBe(payload.patientId);
    expect(json.startTime).toBe(payload.startTime);
    expect(json.endTime).toBe(payload.endTime);
    expect(json.room).toBe(payload.room);
    expect(json.status).toBe(payload.status);
  });

  test("PUT /api/appointments/:id updates appointment", async ({ request }) => {
    const newStart = new Date();
    newStart.setHours(11, 0, 0, 0);
    const newEnd = new Date(newStart.getTime() + 60 * 60000);

    const res = await request.put(`/api/appointments/${createdId}`, {
      data: {
        startTime: newStart.toISOString(),
        endTime: newEnd.toISOString(),
      },
    });

    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.startTime).toBe(newStart.toISOString());
    expect(json.endTime).toBe(newEnd.toISOString());
  });

  test("DELETE /api/appointments/:id deletes appointment", async ({
    request,
  }) => {
    const res = await request.delete(`/api/appointments/${createdId}`);
    expect(res.ok()).toBeTruthy();

    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - 1);
    const end = new Date(now);
    end.setDate(now.getDate() + 1);

    const listRes = await request.get(
      `/api/appointments?start=${start.toISOString()}&end=${end.toISOString()}`
    );
    expect(listRes.ok()).toBeTruthy();
    const listJson = await listRes.json();
    const found = listJson.data?.some((a: { id: string }) => a.id === createdId);
    expect(found).toBeFalsy();
  });
});
