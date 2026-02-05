import { withLatency, maybeFail } from "../../../../lib/fakeNetwork";
import { patients } from "../../../../mocks/patients";
import { providers } from "../../../../mocks/providers";
import type { Patient } from "../../../../types/patient";

type PatientStatus = Patient["status"];
type RiskLevel = Patient["riskLevel"];

function isValidStatus(v: unknown): v is PatientStatus {
  return v === "active" || v === "inactive" || v === "deceased";
}

function isValidRiskLevel(v: unknown): v is RiskLevel {
  return v === "low" || v === "medium" || v === "high" || v === "critical";
}

function isValidDob(v: unknown): v is string {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
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

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await maybeSimulate();
  const { id } = await params;

  const patient = patients.find((p) => p.id === id);
  if (!patient) {
    return Response.json({ error: "Patient not found" }, { status: 404 });
  }

  return Response.json(patient);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await maybeSimulate();
  const { id } = await params;

  const index = patients.findIndex((p) => p.id === id);
  if (index === -1) {
    return Response.json({ error: "Patient not found" }, { status: 404 });
  }

  let body: Partial<Patient>;
  try {
    body = (await req.json()) as Partial<Patient>;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const updates: Partial<Patient> = {};

  if (body.firstName !== undefined) {
    if (!isNonEmptyString(body.firstName)) {
      return Response.json({ error: "Invalid firstName" }, { status: 400 });
    }
    updates.firstName = body.firstName.trim();
  }

  if (body.lastName !== undefined) {
    if (!isNonEmptyString(body.lastName)) {
      return Response.json({ error: "Invalid lastName" }, { status: 400 });
    }
    updates.lastName = body.lastName.trim();
  }

  if (body.dob !== undefined) {
    if (!isValidDob(body.dob)) {
      return Response.json({ error: "Invalid dob" }, { status: 400 });
    }
    updates.dob = body.dob;
  }

  if (body.status !== undefined) {
    if (!isValidStatus(body.status)) {
      return Response.json({ error: "Invalid status" }, { status: 400 });
    }
    updates.status = body.status;
  }

  if (body.riskLevel !== undefined) {
    if (!isValidRiskLevel(body.riskLevel)) {
      return Response.json({ error: "Invalid riskLevel" }, { status: 400 });
    }
    updates.riskLevel = body.riskLevel;
  }

  if (body.primaryProviderId !== undefined) {
    if (!isNonEmptyString(body.primaryProviderId)) {
      return Response.json(
        { error: "Invalid primaryProviderId" },
        { status: 400 }
      );
    }

    const providerIds = new Set(providers.map((p) => p.id));
    if (!providerIds.has(body.primaryProviderId)) {
      return Response.json(
        { error: "Unknown primaryProviderId" },
        { status: 400 }
      );
    }

    updates.primaryProviderId = body.primaryProviderId;
  }

  const updated = { ...patients[index], ...updates };
  patients[index] = updated;

  return Response.json(updated);
}
