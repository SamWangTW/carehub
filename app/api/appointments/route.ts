import { withLatency, maybeFail } from "../../../lib/fakeNetwork";
import {
  list,
  create,
  patientExists,
  providerExists,
  ensureSeeded,
} from "../../../lib/mock-db/appointments";
import type { Appointment } from "../../../types/appointment";

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

export async function GET(req: Request) {
  await maybeSimulate();
  ensureSeeded();
  const url = new URL(req.url);
  const sp = url.searchParams;

  const startRaw = sp.get("start");
  const endRaw = sp.get("end");
  const start = parseDate(startRaw);
  const end = parseDate(endRaw);

  if (!start || !end) {
    return Response.json(
      { error: "start and end query params are required (ISO date strings)." },
      { status: 400 }
    );
  }

  const providerId = sp.get("providerId")?.trim() || undefined;
  const room = sp.get("room")?.trim() || undefined;

  const data = list()
    .filter((a) => {
      const apptStart = new Date(a.startTime);
      if (Number.isNaN(apptStart.getTime())) return false;
      return apptStart >= start && apptStart <= end;
    })
    .filter((a) => (providerId ? a.providerId === providerId : true))
    .filter((a) => (room ? a.room === room : true))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return Response.json({ data });
}

export async function POST(req: Request) {
  await maybeSimulate();

  let body: Partial<Appointment>;
  try {
    body = (await req.json()) as Partial<Appointment>;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isNonEmptyString(body.providerId)) {
    return Response.json({ error: "providerId is required" }, { status: 400 });
  }
  if (!isNonEmptyString(body.patientId)) {
    return Response.json({ error: "patientId is required" }, { status: 400 });
  }

  if (!providerExists(body.providerId)) {
    return Response.json({ error: "Unknown providerId" }, { status: 400 });
  }
  if (!patientExists(body.patientId)) {
    return Response.json({ error: "Unknown patientId" }, { status: 400 });
  }

  const start = parseDate(body.startTime);
  const end = parseDate(body.endTime);
  if (!start || !end) {
    return Response.json(
      { error: "startTime and endTime are required (ISO date strings)." },
      { status: 400 }
    );
  }
  if (start >= end) {
    return Response.json(
      { error: "startTime must be before endTime." },
      { status: 400 }
    );
  }

  const status: AppointmentStatus = isValidStatus(body.status)
    ? body.status
    : "scheduled";

  const room = isNonEmptyString(body.room) ? body.room.trim() : undefined;

  const created = create({
    providerId: body.providerId,
    patientId: body.patientId,
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    status,
    room,
  });

  return Response.json(created, { status: 201 });
}
