// app/patients/page.tsx
import { Suspense } from "react";
import PaginationControls from "./PaginationControls";
import PageSizeSelector from "./PageSizeSelector";
import PatientsFilters from "./PatientsFilters";
import EmptyState from "./EmptyState";
import PatientsTableClient from "./PatientsTableClient";

type Patient = {
  id: string;
  firstName: string;
  lastName: string;
  dob: string; // ISO date string
  mrn: string;
  status: "active" | "inactive" | "deceased";
  riskLevel: "low" | "medium" | "high" | "critical";
  primaryProviderId: string;
  createdAt: string; // ISO datetime
};

type PatientsApiResponse = {
  data: Patient[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

function formatDate(iso: string): string {
  return iso?.slice(0, 10) ?? "";
}

/** Simple table skeleton that matches your current inline-table styling */
function PatientsTableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <>
      <p>Loading…</p>

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
        <thead>
          <tr>
            {["", "ID", "Name", "MRN", "DOB", "Status", "Risk", "Provider ID"].map(
              (h) => (
                <th
                  key={h}
                  style={{
                    borderBottom: "1px solid #ddd",
                    textAlign: "left",
                    padding: 8,
                  }}
                >
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>

        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              {Array.from({ length: 8 }).map((__, j) => (
                <td
                  key={j}
                  style={{
                    borderBottom: "1px solid #f0f0f0",
                    padding: 8,
                  }}
                >
                  <div
                    style={{
                      height: 14,
                      width: "100%",
                      background: "#eee",
                      borderRadius: 6,
                    }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

/**
 * Server Component that does the fetch + renders the table + pagination.
 * Wrapped in Suspense from the page.
 */
async function PatientsTableSection({
  sp,
}: {
  sp: { [key: string]: string | string[] | undefined };
}) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  const parsePositiveInt = (
    value: string | string[] | undefined,
    fallback: number
  ) => {
    if (typeof value !== "string") return fallback;
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
  };

  const getSingle = (v: string | string[] | undefined) =>
    typeof v === "string" ? v : Array.isArray(v) ? v[0] : undefined;

  const safePage = parsePositiveInt(sp.page, 1);

  // ✅ clamp limit to 10/20/50
  const allowed = new Set([10, 20, 50]);
  const safeLimitRaw = parsePositiveInt(sp.limit, 10);
  const safeLimit = allowed.has(safeLimitRaw) ? safeLimitRaw : 10;

  // ✅ Build query string from URL params so filters/search/sort apply
  const qs = new URLSearchParams();

  const search = getSingle(sp.search);
  const status = getSingle(sp.status);
  const riskLevel = getSingle(sp.riskLevel);
  const provider = getSingle(sp.provider);
  const hasUpcoming = getSingle(sp.hasUpcoming);
  const sortBy = getSingle(sp.sortBy);
  const sortOrder = getSingle(sp.sortOrder);

  if (search) qs.set("search", search);
  if (status) qs.set("status", status);
  if (riskLevel) qs.set("riskLevel", riskLevel);
  if (provider) qs.set("provider", provider);
  if (hasUpcoming) qs.set("hasUpcoming", hasUpcoming);
  if (sortBy) qs.set("sortBy", sortBy);
  if (sortOrder) qs.set("sortOrder", sortOrder);

  qs.set("page", String(safePage));
  qs.set("limit", String(safeLimit));

  const res = await fetch(`${baseUrl}/api/patients?${qs.toString()}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return (
      <p style={{ marginTop: 12 }}>
        Failed to load patients (HTTP {res.status}).
      </p>
    );
  }

  const json = (await res.json()) as PatientsApiResponse;
  const patients = json.data ?? [];
  const pagination = json.pagination;

  const thStyle = {
    borderBottom: "1px solid #ddd",
    textAlign: "left" as const,
    padding: 8,
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <p style={{ margin: 0 }}>
          Total: {pagination.total} • Page {pagination.page} of{" "}
          {pagination.totalPages}
        </p>
        <PageSizeSelector />
      </div>

      {patients.length === 0 ? <EmptyState /> : <PatientsTableClient patients={patients} />}

      <PaginationControls
        page={pagination.page}
        totalPages={pagination.totalPages}
      />
    </>
  );
}

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;

  // For skeleton row count, match current limit if present
  const limit =
    typeof sp.limit === "string" && Number.isFinite(Number(sp.limit))
      ? Math.max(1, Math.floor(Number(sp.limit)))
      : 10;

  return (
    <main style={{ padding: 24 }}>
      <PatientsFilters />

      <Suspense fallback={<PatientsTableSkeleton rows={limit} />}>
        <PatientsTableSection key={JSON.stringify(sp)} sp={sp} />
      </Suspense>
    </main>
  );
}
