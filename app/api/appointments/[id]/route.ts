import { withLatency, maybeFail } from "../../../../lib/fakeNetwork";
import {
  getById,
  update,
  remove,
  patientExists,
  providerExists,
  ensureSeeded,
} from "../../../../lib/mock-db/appointments";
import type { Appointment } from "../../../../types/appointment";

type AppointmentStatus = Appointment["status"];

function isValidStatus(v: unknown): v is AppointmentStatus {
  return v === "scheduled" || v === "completed" || v === "canceled";
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function maybeSimulate() {
  const latencyOn = process.env.NEXT_PUBLIC_FAKE_LATENCY === "1";
  const errorRate = Number(process.env.NEXT_PUBLIC_FAKE_ERROR_RATE ?? "0");

  if (latencyOn) {
    await withLatency();
  }

  if (errorRate > 0) {
    maybeFail(errorRate);
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await maybeSimulate();
  ensureSeeded();
  const { id } = await params;

  const existing = getById(id);
  if (!existing) {
    return Response.json({ error: "Appointment not found" }, { status: 404 });
  }

  let body: Partial<Appointment>;
  try {
    body = (await req.json()) as Partial<Appointment>;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const updates: Partial<Appointment> = {};

  if (body.providerId !== undefined) {
    if (!isNonEmptyString(body.providerId)) {
      return Response.json({ error: "Invalid providerId" }, { status: 400 });
    }
    if (!providerExists(body.providerId)) {
      return Response.json({ error: "Unknown providerId" }, { status: 400 });
    }
    updates.providerId = body.providerId.trim();
  }

  if (body.patientId !== undefined) {
    if (!isNonEmptyString(body.patientId)) {
      return Response.json({ error: "Invalid patientId" }, { status: 400 });
    }
    if (!patientExists(body.patientId)) {
      return Response.json({ error: "Unknown patientId" }, { status: 400 });
    }
    updates.patientId = body.patientId.trim();
  }

  if (body.startTime !== undefined) {
    const start = parseDate(body.startTime);
    if (!start) {
      return Response.json({ error: "Invalid startTime" }, { status: 400 });
    }
    updates.startTime = start.toISOString();
  }

  if (body.endTime !== undefined) {
    const end = parseDate(body.endTime);
    if (!end) {
      return Response.json({ error: "Invalid endTime" }, { status: 400 });
    }
    updates.endTime = end.toISOString();
  }

  if (body.status !== undefined) {
    if (!isValidStatus(body.status)) {
      return Response.json({ error: "Invalid status" }, { status: 400 });
    }
    updates.status = body.status;
  }

  if (body.room !== undefined) {
    updates.room = isNonEmptyString(body.room) ? body.room.trim() : undefined;
  }

  const nextStart = updates.startTime ?? existing.startTime;
  const nextEnd = updates.endTime ?? existing.endTime;
  if (new Date(nextStart) >= new Date(nextEnd)) {
    return Response.json(
      { error: "startTime must be before endTime." },
      { status: 400 }
    );
  }

  const updated = update(id, updates);
  return Response.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await maybeSimulate();
  ensureSeeded();
  const { id } = await params;

  const ok = remove(id);
  if (!ok) {
    // Treat delete as idempotent to avoid client/server drift.
    return Response.json({ ok: true });
  }

  return Response.json({ ok: true });
}
