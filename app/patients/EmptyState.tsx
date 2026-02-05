"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function EmptyState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const hasAnyFilters =
    ["search", "status", "riskLevel", "provider", "hasUpcoming", "sortBy", "sortOrder"].some(
      (k) => searchParams.get(k)
    );

  function clearFiltersKeepLimit() {
    const next = new URLSearchParams();
    const limit = searchParams.get("limit");
    if (limit) next.set("limit", limit);
    next.set("page", "1");
    router.push(`${pathname}?${next.toString()}`);
  }

  function resetAll() {
    router.push(`${pathname}`);
  }

  function mockAddPatient() {
    alert("Mock: open Add Patient flow");
  }

  return (
    <div
      style={{
        border: "1px solid #333",
        borderRadius: 12,
        padding: 16,
        marginTop: 12,
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 600 }}>No patients found</div>
      <div style={{ marginTop: 6, opacity: 0.8 }}>
        Try adjusting your filters or search terms.
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
        {hasAnyFilters ? (
          <button
            type="button"
            onClick={clearFiltersKeepLimit}
            style={{
              border: "1px solid #777",
              borderRadius: 8,
              padding: "8px 12px",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            Clear filters
          </button>
        ) : null}

        <button
          type="button"
          onClick={resetAll}
          style={{
            border: "1px solid #777",
            borderRadius: 8,
            padding: "8px 12px",
            background: "transparent",
            cursor: "pointer",
          }}
        >
          Reset
        </button>

        <button
          type="button"
          onClick={mockAddPatient}
          style={{
            border: "1px solid #777",
            borderRadius: 8,
            padding: "8px 12px",
            background: "transparent",
            cursor: "pointer",
          }}
        >
          Add patient (mock)
        </button>
      </div>
    </div>
  );
}