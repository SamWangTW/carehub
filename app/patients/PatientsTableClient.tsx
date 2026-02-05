"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Patient } from "../../types/patient";
import SortableHeader from "./SortableHeader";
import BulkActionBar from "./BulkActionBar";

function formatDate(iso: string): string {
  return iso?.slice(0, 10) ?? "";
}

export default function PatientsTableClient({
  patients,
}: {
  patients: Patient[];
}) {
  const idsOnPage = useMemo(() => patients.map((p) => p.id), [patients]);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Minimal + acceptable: selection is per-page; clear selection when page/filter/sort changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [idsOnPage.join("|")]);

  const allOnPageSelected =
    idsOnPage.length > 0 && idsOnPage.every((id) => selectedIds.has(id));

  const someOnPageSelected =
    idsOnPage.some((id) => selectedIds.has(id)) && !allOnPageSelected;

  const selectedPatients = useMemo(
    () => patients.filter((p) => selectedIds.has(p.id)),
    [patients, selectedIds]
  );

  function toggleRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllOnPage() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        // unselect all on this page
        for (const id of idsOnPage) next.delete(id);
      } else {
        // select all on this page
        for (const id of idsOnPage) next.add(id);
      }
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  const thStyle = {
    borderBottom: "1px solid #ddd",
    textAlign: "left" as const,
    padding: 8,
    whiteSpace: "nowrap" as const,
  };

  return (
    <>
      {selectedPatients.length > 0 && (
        <BulkActionBar selectedPatients={selectedPatients} onClear={clearSelection} />
      )}

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
        <thead>
          <tr>
            {/* Selection column */}
            <th style={{ ...thStyle, width: 36 }}>
              <input
                type="checkbox"
                checked={allOnPageSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someOnPageSelected;
                }}
                onChange={toggleAllOnPage}
                aria-label="Select all on this page"
              />
            </th>

            <th style={thStyle}>
              <SortableHeader label="ID" sortKey="id" />
            </th>

            <th style={thStyle}>
              {/* IMPORTANT: backend expects lastName */}
              <SortableHeader label="Name" sortKey="lastName" />
            </th>

            <th style={thStyle}>
              <SortableHeader label="MRN" sortKey="mrn" />
            </th>

            <th style={thStyle}>
              <SortableHeader label="DOB" sortKey="dob" />
            </th>

            <th style={thStyle}>
              <SortableHeader label="Status" sortKey="status" />
            </th>

            <th style={thStyle}>
              <SortableHeader label="Risk" sortKey="riskLevel" />
            </th>

            <th style={thStyle}>
              <SortableHeader label="Provider ID" sortKey="primaryProviderId" />
            </th>
          </tr>
        </thead>

        <tbody>
          {patients.map((p) => {
            const checked = selectedIds.has(p.id);

            return (
              <tr key={p.id}>
                <td style={{ borderBottom: "1px solid #f0f0f0", padding: 8 }}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleRow(p.id)}
                    aria-label={`Select patient ${p.id}`}
                  />
                </td>

                <td style={{ borderBottom: "1px solid #f0f0f0", padding: 8 }}>
                  {p.id}
                </td>

                <td style={{ borderBottom: "1px solid #f0f0f0", padding: 8 }}>
                  <Link
                    href={`/patients/${p.id}`}
                    style={{
                      color: "inherit",
                      textDecoration: "none",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.textDecoration = "underline";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.textDecoration = "none";
                    }}
                  >
                    {p.firstName} {p.lastName}
                  </Link>
                </td>

                <td style={{ borderBottom: "1px solid #f0f0f0", padding: 8 }}>
                  {p.mrn}
                </td>

                <td style={{ borderBottom: "1px solid #f0f0f0", padding: 8 }}>
                  {formatDate(p.dob)}
                </td>

                <td style={{ borderBottom: "1px solid #f0f0f0", padding: 8 }}>
                  {p.status}
                </td>

                <td style={{ borderBottom: "1px solid #f0f0f0", padding: 8 }}>
                  {p.riskLevel}
                </td>

                <td style={{ borderBottom: "1px solid #f0f0f0", padding: 8 }}>
                  {p.primaryProviderId}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}
