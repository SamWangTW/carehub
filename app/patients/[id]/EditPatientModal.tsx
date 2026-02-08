"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import type { Patient } from "../../../types/patient";

type ProviderOption = {
  id: string;
  name: string;
};

type Props = {
  patient: Patient;
  providers: ProviderOption[];
};

type FormState = {
  firstName: string;
  lastName: string;
  dob: string;
  status: Patient["status"];
  riskLevel: Patient["riskLevel"];
  primaryProviderId: string;
};

const editPatientSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required."),
  lastName: z.string().trim().min(1, "Last name is required."),
  dob: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "DOB must be in YYYY-MM-DD format."),
  status: z.enum(["active", "inactive", "deceased"]),
  riskLevel: z.enum(["low", "medium", "high", "critical"]),
  primaryProviderId: z.string().trim().min(1, "Primary provider is required."),
});

export default function EditPatientModal({ patient, providers }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialState: FormState = useMemo(
    () => ({
      firstName: patient.firstName,
      lastName: patient.lastName,
      dob: patient.dob,
      status: patient.status,
      riskLevel: patient.riskLevel,
      primaryProviderId: patient.primaryProviderId,
    }),
    [patient]
  );

  const [form, setForm] = useState<FormState>(initialState);

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: currentYear - 1900 + 1 }, (_, i) =>
    String(currentYear - i)
  );
  const monthOptions = Array.from({ length: 12 }, (_, i) =>
    String(i + 1).padStart(2, "0")
  );
  const dayOptions = Array.from({ length: 31 }, (_, i) =>
    String(i + 1).padStart(2, "0")
  );

  const inputStyle = {
    width: "100%",
    padding: 8,
    color: "#111",
    background: "#fff",
    border: "1px solid #ccc",
  } as const;

  function close() {
    setOpen(false);
    setError(null);
    setForm(initialState);
  }

  function validate(state: FormState): string | null {
    const result = editPatientSchema.safeParse(state);
    if (result.success) return null;
    return result.error.issues[0]?.message ?? "Invalid form values.";
  }

  function setDobPart(part: "year" | "month" | "day", value: string) {
    const [y = "", m = "", d = ""] = form.dob.split("-");
    const nextYear = part === "year" ? value : y;
    const nextMonth = part === "month" ? value : m;
    const nextDay = part === "day" ? value : d;
    setForm((prev) => ({
      ...prev,
      dob: `${nextYear}-${nextMonth}-${nextDay}`,
    }));
  }

  async function handleSave() {
    const message = validate(form);
    if (message) {
      setError(message);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/patients/${patient.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Failed to save changes.");
      }

      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        data-testid="edit-patient-open"
        onClick={() => setOpen(true)}
        style={{
          padding: "6px 10px",
          borderRadius: 6,
          border: "1px solid #2a2a2a",
          background: "rgba(255,255,255,0.06)",
          color: "#e6e6e6",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.12)";
          e.currentTarget.style.textDecoration = "underline";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.06)";
          e.currentTarget.style.textDecoration = "none";
        }}
        onFocus={(e) => {
          e.currentTarget.style.boxShadow =
            "0 0 0 3px rgba(45,108,223,0.35)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        Edit Patient
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          data-testid="edit-patient-modal"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 50,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 16,
              borderRadius: 8,
              width: "100%",
              maxWidth: 520,
              color: "#111",
            }}
          >
            <h3 style={{ marginTop: 0 }}>Edit Patient</h3>

            {error && (
              <p style={{ color: "#b00020", marginTop: 0 }}>{error}</p>
            )}

            <div style={{ display: "grid", gap: 12 }}>
              <label style={{ color: "#333" }}>
                First Name
                <input
                  data-testid="edit-patient-first-name"
                  type="text"
                  value={form.firstName}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, firstName: e.target.value }))
                  }
                  style={inputStyle}
                />
              </label>

              <label style={{ color: "#333" }}>
                Last Name
                <input
                  data-testid="edit-patient-last-name"
                  type="text"
                  value={form.lastName}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, lastName: e.target.value }))
                  }
                  style={inputStyle}
                />
              </label>

              <label style={{ color: "#333" }}>
                Date of Birth
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  <select
                    data-testid="edit-patient-dob-month"
                    value={form.dob.split("-")[1] ?? ""}
                    onChange={(e) => setDobPart("month", e.target.value)}
                    style={inputStyle}
                  >
                    {monthOptions.map((month) => (
                      <option key={month} value={month}>
                        {month}
                      </option>
                    ))}
                  </select>

                  <select
                    data-testid="edit-patient-dob-day"
                    value={form.dob.split("-")[2] ?? ""}
                    onChange={(e) => setDobPart("day", e.target.value)}
                    style={inputStyle}
                  >
                    {dayOptions.map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>

                  <select
                    data-testid="edit-patient-dob-year"
                    value={form.dob.split("-")[0] ?? ""}
                    onChange={(e) => setDobPart("year", e.target.value)}
                    style={inputStyle}
                  >
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  data-testid="edit-patient-dob"
                  type="hidden"
                  value={form.dob}
                  readOnly
                />
              </label>

              <label style={{ color: "#333" }}>
                Status
                <select
                  data-testid="edit-patient-status"
                  value={form.status}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      status: e.target.value as Patient["status"],
                    }))
                  }
                  style={inputStyle}
                >
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                  <option value="deceased">deceased</option>
                </select>
              </label>

              <label style={{ color: "#333" }}>
                Risk Level
                <select
                  data-testid="edit-patient-risk"
                  value={form.riskLevel}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      riskLevel: e.target.value as Patient["riskLevel"],
                    }))
                  }
                  style={inputStyle}
                >
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                  <option value="critical">critical</option>
                </select>
              </label>

              <label style={{ color: "#333" }}>
                Primary Provider
                <select
                  data-testid="edit-patient-provider"
                  value={form.primaryProviderId}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      primaryProviderId: e.target.value,
                    }))
                  }
                  style={inputStyle}
                >
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.id})
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 16,
                justifyContent: "flex-end",
              }}
            >
              <button
                data-testid="edit-patient-cancel"
                onClick={close}
                disabled={saving}
                style={{
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "1px solid #ccc",
                  background: "#fff",
                  color: "#111",
                  cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.7 : 1,
                }}
                onMouseEnter={(e) => {
                  if (saving) return;
                  e.currentTarget.style.background = "#f0f0f0";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#fff";
                }}
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 0 0 3px rgba(45,108,223,0.35)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                Cancel
              </button>
              <button
                data-testid="edit-patient-save"
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "1px solid #1f56b3",
                  background: "#2d6cdf",
                  color: "#fff",
                  cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.7 : 1,
                }}
                onMouseEnter={(e) => {
                  if (saving) return;
                  e.currentTarget.style.background = "#1f56b3";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#2d6cdf";
                }}
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 0 0 3px rgba(45,108,223,0.35)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
