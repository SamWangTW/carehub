"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  selectStyle,
  optionStyle,
  controlLabelStyle,
  inputStyle,
} from "./filterStyles";

type PatientStatus = "active" | "inactive" | "deceased";
type RiskLevel = "low" | "medium" | "high" | "critical";

type Props = {
  /** Debounce delay for search input (ms). Default 300 */
  debounceMs?: number;
};

function getParam(sp: URLSearchParams, key: string): string {
  return sp.get(key) ?? "";
}

export default function PatientsFilters({ debounceMs = 300 }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read current URL params (source of truth)
  const current = useMemo(() => {
    const sp = new URLSearchParams(searchParams.toString());
    return {
      search: getParam(sp, "search"),
      status: getParam(sp, "status"),
      riskLevel: getParam(sp, "riskLevel"),
      provider: getParam(sp, "provider"),
      hasUpcoming: getParam(sp, "hasUpcoming"),
      limit: getParam(sp, "limit"),
      sortBy: getParam(sp, "sortBy"),
      sortOrder: getParam(sp, "sortOrder"),
      page: getParam(sp, "page"),
    };
  }, [searchParams]);

  // Local state for debounced search UX
  const [searchText, setSearchText] = useState(current.search);

  // Keep local search text in sync when user navigates (back/forward, links, etc.)
  useEffect(() => {
    setSearchText(current.search);
  }, [current.search]);

  const timerRef = useRef<number | null>(null);

  function pushWithParams(next: (sp: URLSearchParams) => void) {
    const sp = new URLSearchParams(searchParams.toString());
    next(sp);

    // If a filter changes, go back to page 1
    if (sp.get("page") !== "1") sp.set("page", "1");

    router.push(`${pathname}?${sp.toString()}`);
  }

  function setOrClear(sp: URLSearchParams, key: string, value: string) {
    const v = value.trim();
    if (!v) sp.delete(key);
    else sp.set(key, v);
  }

  function onSearchChange(value: string) {
    setSearchText(value);

    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      pushWithParams((sp) => {
        setOrClear(sp, "search", value);
      });
    }, debounceMs);
  }

  function onStatusChange(value: string) {
    pushWithParams((sp) => {
      setOrClear(sp, "status", value);
    });
  }

  function onRiskChange(value: string) {
    pushWithParams((sp) => {
      setOrClear(sp, "riskLevel", value);
    });
  }

  function onHasUpcomingChange(value: string) {
    pushWithParams((sp) => {
      setOrClear(sp, "hasUpcoming", value);
    });
  }

  function onProviderChange(value: string) {
    pushWithParams((sp) => {
      setOrClear(sp, "provider", value);
    });
  }

  function onReset() {
    const sp = new URLSearchParams(searchParams.toString());
    sp.delete("search");
    sp.delete("status");
    sp.delete("riskLevel");
    sp.delete("provider");
    sp.delete("hasUpcoming");
    sp.set("page", "1");
    router.push(`${pathname}?${sp.toString()}`);
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1.4fr 0.8fr 0.8fr 0.8fr 1fr auto",
        gap: 12,
        alignItems: "end",
        marginTop: 12,
        marginBottom: 12,
      }}
    >
      {/* Search */}
      <label style={{ display: "grid", gap: 6 }}>
        <span style={controlLabelStyle}>Search (name / MRN / DOB)</span>
        <input
          value={searchText}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="e.g. Chen, 12345, 1990-01-01"
          style={inputStyle}
        />
      </label>

      {/* Status */}
      <label style={{ display: "grid", gap: 6 }}>
        <span style={controlLabelStyle}>Status</span>
        <select
          value={current.status}
          onChange={(e) => onStatusChange(e.target.value)}
          style={selectStyle}
        >
          <option value="" style={optionStyle}>
            All
          </option>
          {(["active", "inactive", "deceased"] as PatientStatus[]).map((s) => (
            <option key={s} value={s} style={optionStyle}>
              {s}
            </option>
          ))}
        </select>
      </label>

      {/* Risk */}
      <label style={{ display: "grid", gap: 6 }}>
        <span style={controlLabelStyle}>Risk</span>
        <select
          value={current.riskLevel}
          onChange={(e) => onRiskChange(e.target.value)}
          style={selectStyle}
        >
          <option value="" style={optionStyle}>
            All
          </option>
          {(["low", "medium", "high", "critical"] as RiskLevel[]).map((r) => (
            <option key={r} value={r} style={optionStyle}>
              {r}
            </option>
          ))}
        </select>
      </label>

      {/* Upcoming Appointment */}
      <label style={{ display: "grid", gap: 6 }}>
        <span style={controlLabelStyle}>Upcoming Appt</span>
        <select
          value={current.hasUpcoming}
          onChange={(e) => onHasUpcomingChange(e.target.value)}
          style={selectStyle}
        >
          <option value="" style={optionStyle}>
            All
          </option>
          <option value="true" style={optionStyle}>
            Has upcoming
          </option>
          <option value="false" style={optionStyle}>
            No upcoming
          </option>
        </select>
      </label>

      {/* Provider */}
      <label style={{ display: "grid", gap: 6 }}>
        <span style={controlLabelStyle}>Provider ID</span>
        <input
          value={current.provider}
          onChange={(e) => onProviderChange(e.target.value)}
          placeholder="e.g. prov_001"
          style={inputStyle}
        />
      </label>

      {/* Reset */}
      <button
        type="button"
        onClick={onReset}
        style={{
          padding: "8px 12px",
          border: "1px solid #ccc",
          borderRadius: 6,
          background: "#111",
          color: "#fff",
          cursor: "pointer",
          height: 38,
        }}
      >
        Reset
      </button>
    </div>
  );
}