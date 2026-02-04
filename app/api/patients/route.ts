import { withLatency } from "../../../lib/fakeNetwork";
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

export async function GET(req: Request) {
  await withLatency(); // 200–500ms simulated latency

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
  const limit = parseIntSafe(sp.get("limit"), 10);

  const sortBy = sp.get("sortBy")?.trim() || "lastName";
  const sortOrder = (sp.get("sortOrder") === "desc" ? "desc" : "asc") as
    | "asc"
    | "desc";

  // Precompute upcoming appointments by patientId (for hasUpcoming filter)
  const now = new Date();
  const upcomingByPatient = new Set<string>();
  for (const appt of appointments) {
    if (appt.status !== "scheduled") continue;
    const start = new Date(appt.startTime);
    if (start > now) upcomingByPatient.add(appt.patientId);
  }

  // 1) Filter
  let filtered = patients.slice();

  if (search) {
    filtered = filtered.filter((p) => {
      const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
      const mrn = (p.mrn ?? "").toLowerCase();
      const dob = (p.dob ?? "").toLowerCase();

      return (
        fullName.includes(search) ||
        mrn.includes(search) ||
        dob.includes(search)
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

  // 2) Sort (by any column, safely)
  filtered.sort((a, b) => {
    const aVal = safeString((a as any)[sortBy]);
    const bVal = safeString((b as any)[sortBy]);

    // numeric compare when both are numeric-like
    const aNum = Number(aVal);
    const bNum = Number(bVal);
    const bothNumeric = Number.isFinite(aNum) && Number.isFinite(bNum);

    let cmp = 0;
    if (bothNumeric) {
      cmp = aNum - bNum;
    } else {
      cmp = aVal.localeCompare(bVal, undefined, { sensitivity: "base" });
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
