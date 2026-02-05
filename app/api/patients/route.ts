// app/api/patients/route.ts
import { withLatency, maybeFail } from "../../../lib/fakeNetwork";
import { patients } from "../../../mocks/patients";
import { appointments } from "../../../mocks/appointments";

import type { Patient } from "../../../types/patient";

type PatientStatus = Patient["status"];
type RiskLevel = Patient["riskLevel"];

function parseIntSafe(value: string | null, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function parseBoolean(value: string | null): boolean | undefined {
  if (value === null) return undefined;
  if (value.toLowerCase() === "true") return true;
  if (value.toLowerCase() === "false") return false;
  return undefined;
}

function isValidStatus(v: string | null): v is PatientStatus {
  return v === "active" || v === "inactive" || v === "deceased";
}

function isValidRiskLevel(v: string | null): v is RiskLevel {
  return v === "low" || v === "medium" || v === "high" || v === "critical";
}

function safeString(v: unknown): string {
  return typeof v === "string" ? v : String(v ?? "");
}

/** Semantic order for enums */
const riskRank: Record<RiskLevel, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

const statusRank: Record<PatientStatus, number> = {
  inactive: 1,
  active: 2,
  deceased: 3,
};

/** Allowlist for sortBy to prevent invalid keys */
const allowedSortBy = new Set([
  "id",
  "mrn",
  "primaryProviderId",
  "firstName",
  "lastName",
  "dob",
  "createdAt",
  "status",
  "riskLevel",
]);

export async function GET(req: Request) {
  const latencyOn = process.env.NEXT_PUBLIC_FAKE_LATENCY === "1";
  const errorRate = Number(process.env.NEXT_PUBLIC_FAKE_ERROR_RATE ?? "0");

  if (latencyOn) {
    await withLatency();
  }

  if (errorRate > 0) {
    maybeFail(errorRate);
  }

  const url = new URL(req.url);
  const sp = url.searchParams;

  const searchRaw = sp.get("search")?.trim() ?? "";
  const search = searchRaw.toLowerCase();

  const statusParam = sp.get("status");
  const status = isValidStatus(statusParam) ? statusParam : undefined;

  const providerId = sp.get("provider")?.trim() || undefined;
  const hasUpcoming = parseBoolean(sp.get("hasUpcoming"));

  const riskParam = sp.get("riskLevel");
  const riskLevel = isValidRiskLevel(riskParam) ? riskParam : undefined;

  const page = parseIntSafe(sp.get("page"), 1);
  const rawLimit = parseIntSafe(sp.get("limit"), 10);
  const allowedLimits = new Set([10, 20, 50]);
  const limit = allowedLimits.has(rawLimit) ? rawLimit : 10;

  const rawSortBy = sp.get("sortBy")?.trim() || "lastName";
  const sortBy = allowedSortBy.has(rawSortBy) ? rawSortBy : "lastName";

  const sortOrder =
    sp.get("sortOrder") === "desc" ? "desc" : ("asc" as "asc" | "desc");

  // Precompute upcoming appointments by patientId
  const now = new Date();
  const upcomingByPatient = new Set<string>();
  for (const appt of appointments) {
    if (appt.status !== "scheduled") continue;
    if (new Date(appt.startTime) > now) {
      upcomingByPatient.add(appt.patientId);
    }
  }

  // 1) Filter
  let filtered = patients.slice();

  if (search) {
    filtered = filtered.filter((p) => {
      const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
      return (
        fullName.includes(search) ||
        p.mrn.toLowerCase().includes(search) ||
        p.dob.toLowerCase().includes(search)
      );
    });
  }

  if (status) {
    filtered = filtered.filter((p) => p.status === status);
  }

  if (providerId) {
    filtered = filtered.filter((p) => p.primaryProviderId === providerId);
  }

  if (typeof hasUpcoming === "boolean") {
    filtered = filtered.filter((p) =>
      hasUpcoming ? upcomingByPatient.has(p.id) : !upcomingByPatient.has(p.id)
    );
  }

  if (riskLevel) {
    filtered = filtered.filter((p) => p.riskLevel === riskLevel);
  }

  // 2) Sort (semantic where needed)
  filtered.sort((a, b) => {
    let cmp = 0;

    // Name: lastName, then firstName
    if (sortBy === "lastName") {
      cmp = a.lastName.localeCompare(b.lastName, undefined, {
        sensitivity: "base",
      });
      if (cmp === 0) {
        cmp = a.firstName.localeCompare(b.firstName, undefined, {
          sensitivity: "base",
        });
      }
    }
    // Date fields
    else if (sortBy === "dob" || sortBy === "createdAt") {
      const aTime = new Date(a[sortBy]).getTime();
      const bTime = new Date(b[sortBy]).getTime();
      cmp = (aTime || 0) - (bTime || 0);
    }
    // Risk severity
    else if (sortBy === "riskLevel") {
      cmp = riskRank[a.riskLevel] - riskRank[b.riskLevel];
    }
    // Status workflow
    else if (sortBy === "status") {
      cmp = statusRank[a.status] - statusRank[b.status];
    }
    // Default: string / numeric fallback
    else {
      const aVal = safeString((a as any)[sortBy]);
      const bVal = safeString((b as any)[sortBy]);

      const aNum = Number(aVal);
      const bNum = Number(bVal);
      const bothNumeric = Number.isFinite(aNum) && Number.isFinite(bNum);

      cmp = bothNumeric
        ? aNum - bNum
        : aVal.localeCompare(bVal, undefined, { sensitivity: "base" });
    }

    return sortOrder === "desc" ? -cmp : cmp;
  });

  // 3) Pagination
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * limit;
  const data = filtered.slice(startIndex, startIndex + limit);

  return Response.json({
    data,
    pagination: {
      page: safePage,
      limit,
      total,
      totalPages,
    },
  });
}