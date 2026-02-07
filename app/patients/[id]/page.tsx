import Link from "next/link";
import { Suspense } from "react";
import type { Patient } from "../../../types/patient";
import type { Appointment } from "../../../types/appointment";
import type { VitalReading } from "../../../types/vital";
import type { Note } from "../../../types/note";
import { providers } from "../../../mocks/providers";
import SectionErrorBoundary from "./SectionErrorBoundary";
import EditPatientModal from "./EditPatientModal";
import NotesSectionClient from "./NotesSectionClient";
import VitalsChart from "./VitalsChart";

type TabKey = "overview" | "appointments" | "vitals" | "notes";

type PatientsApiResponse<T> = {
  data: T;
};

const validTabs = new Set<TabKey>([
  "overview",
  "appointments",
  "vitals",
  "notes",
]);

function getTab(
  sp: { [key: string]: string | string[] | undefined }
): TabKey {
  const raw =
    typeof sp.tab === "string"
      ? sp.tab
      : Array.isArray(sp.tab)
        ? sp.tab[0]
        : undefined;

  return validTabs.has(raw as TabKey) ? (raw as TabKey) : "overview";
}

function SectionSkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div style={{ marginTop: 12 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 12,
            background: "#eee",
            borderRadius: 6,
            marginBottom: 8,
          }}
        />
      ))}
    </div>
  );
}

async function fetchJson<T>(path: string): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}${path}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

async function PatientHeader({
  patientPromise,
}: {
  patientPromise: Promise<Patient>;
}) {
  try {
    const patient = await patientPromise;
    const provider = providers.find((p) => p.id === patient.primaryProviderId);
    const photoUrl = (patient as { photoUrl?: string }).photoUrl;
    const initials = `${patient.firstName?.[0] ?? ""}${
      patient.lastName?.[0] ?? ""
    }`.toUpperCase();

    return (
      <div
        style={{
          marginTop: 12,
          padding: 16,
          borderRadius: 10,
          border: "1px solid #2a2a2a",
          background: "rgba(255,255,255,0.04)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              aria-label="Patient avatar"
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "#2b2b2b",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 600,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {initials || "?"}
              {photoUrl && (
                <img
                  src={photoUrl}
                  alt={`${patient.firstName} ${patient.lastName}`}
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display =
                      "none";
                  }}
                />
              )}
            </div>
            <h2 style={{ margin: 0 }} data-testid="patient-header-name">
              {patient.firstName} {patient.lastName}
            </h2>
          </div>
          <EditPatientModal
            patient={patient}
            providers={providers.map((p) => ({ id: p.id, name: p.name }))}
          />
        </div>

        <div
          style={{
            marginTop: 12,
            display: "grid",
            gap: 6,
            color: "#d5d5d5",
            fontSize: 14,
          }}
        >
          <div>
            <span style={{ color: "#9aa0a6" }}>MRN:</span> {patient.mrn}
          </div>
          <div>
            <span style={{ color: "#9aa0a6" }}>DOB:</span> {patient.dob}
          </div>
          <div>
            <span style={{ color: "#9aa0a6" }}>Status:</span> {patient.status}
          </div>
          <div>
            <span style={{ color: "#9aa0a6" }}>Risk:</span> {patient.riskLevel}
          </div>
          <div>
            <span style={{ color: "#9aa0a6" }}>Primary Provider:</span>{" "}
            {provider ? provider.name : patient.primaryProviderId}
          </div>
        </div>
      </div>
    );
  } catch (err) {
    return (
      <p style={{ marginTop: 12, color: "#b00020" }}>
        Failed to load patient header.
      </p>
    );
  }
}

async function OverviewSection({
  patientPromise,
  appointmentsPromise,
}: {
  patientPromise: Promise<Patient>;
  appointmentsPromise: Promise<PatientsApiResponse<Appointment[]>>;
}) {
  try {
    const [patient, appointmentsRes] = await Promise.all([
      patientPromise,
      appointmentsPromise,
    ]);
    const appointments = appointmentsRes.data ?? [];
    const now = new Date();

    const sorted = [...appointments].sort((a, b) =>
      a.startTime.localeCompare(b.startTime)
    );
    const past = sorted.filter((a) => new Date(a.endTime) <= now);
    const upcoming = sorted.filter((a) => new Date(a.startTime) > now);

    const lastVisit = past.length > 0 ? past[past.length - 1] : null;
    const nextAppt = upcoming.length > 0 ? upcoming[0] : null;

    const providerName = (id: string) =>
      providers.find((p) => p.id === id)?.name ?? id;

    const meds =
      (patient as { activeMeds?: string[] }).activeMeds ??
      ["Atorvastatin", "Metformin", "Lisinopril"].slice(
        0,
        (patient.id.charCodeAt(patient.id.length - 1) % 3) + 1
      );

    const alerts: string[] = [];
    if (patient.riskLevel === "high" || patient.riskLevel === "critical") {
      alerts.push("High risk");
    }
    if (patient.status === "inactive") alerts.push("Inactive status");
    if (patient.status === "deceased") alerts.push("Deceased");
    if (alerts.length === 0) alerts.push("No alerts");

    return (
      <div
        style={{
          marginTop: 12,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 12,
        }}
      >
        <div
          style={{
            border: "1px solid #2a2a2a",
            borderRadius: 10,
            padding: 12,
            background: "rgba(255,255,255,0.03)",
          }}
        >
          <div style={{ color: "#9aa0a6", fontSize: 12 }}>Last Visit</div>
          {lastVisit ? (
            <>
              <div style={{ fontSize: 16, fontWeight: 600 }}>
                {lastVisit.startTime.slice(0, 10)}
              </div>
              <div style={{ color: "#cfcfcf", fontSize: 13 }}>
                {providerName(lastVisit.providerId)}
              </div>
            </>
          ) : (
            <div style={{ marginTop: 6, color: "#cfcfcf" }}>
              No prior visits
            </div>
          )}
        </div>

        <div
          style={{
            border: "1px solid #2a2a2a",
            borderRadius: 10,
            padding: 12,
            background: "rgba(255,255,255,0.03)",
          }}
        >
          <div style={{ color: "#9aa0a6", fontSize: 12 }}>Next Appointment</div>
          {nextAppt ? (
            <>
              <div style={{ fontSize: 16, fontWeight: 600 }}>
                {nextAppt.startTime.slice(0, 16).replace("T", " ")}
              </div>
              <div style={{ color: "#cfcfcf", fontSize: 13 }}>
                {providerName(nextAppt.providerId)}
                {nextAppt.room ? ` • ${nextAppt.room}` : ""}
              </div>
            </>
          ) : (
            <div style={{ marginTop: 6, color: "#cfcfcf" }}>
              No upcoming appointment
            </div>
          )}
        </div>

        <div
          style={{
            border: "1px solid #2a2a2a",
            borderRadius: 10,
            padding: 12,
            background: "rgba(255,255,255,0.03)",
          }}
        >
          <div style={{ color: "#9aa0a6", fontSize: 12 }}>Active Meds</div>
          {meds.length > 0 ? (
            <>
              <div style={{ fontSize: 16, fontWeight: 600 }}>
                {meds.length} active
              </div>
              <div style={{ color: "#cfcfcf", fontSize: 13 }}>
                {meds.slice(0, 3).join(", ")}
              </div>
            </>
          ) : (
            <div style={{ marginTop: 6, color: "#cfcfcf" }}>
              No active medications
            </div>
          )}
        </div>

        <div
          style={{
            border: "1px solid #2a2a2a",
            borderRadius: 10,
            padding: 12,
            background: "rgba(255,255,255,0.03)",
          }}
        >
          <div style={{ color: "#9aa0a6", fontSize: 12 }}>Alerts</div>
          {alerts[0] === "No alerts" ? (
            <div style={{ marginTop: 6, color: "#cfcfcf" }}>
              No alerts
            </div>
          ) : (
            <ul style={{ paddingLeft: 16, marginTop: 6 }}>
              {alerts.map((a) => (
                <li key={a} style={{ color: "#cfcfcf" }}>
                  {a}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  } catch {
    return (
      <p style={{ marginTop: 12, color: "#b00020" }}>
        Failed to load patient overview.
      </p>
    );
  }
}

async function AppointmentsSection({
  appointmentsPromise,
}: {
  appointmentsPromise: Promise<PatientsApiResponse<Appointment[]>>;
}) {
  try {
    const { data } = await appointmentsPromise;
    const appointments = data ?? [];

    return (
      <div style={{ marginTop: 12 }}>
        {appointments.length === 0 ? (
          <p>No appointments found.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Start", "End", "Status", "Provider", "Room"].map((h) => (
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
                ))}
              </tr>
            </thead>
            <tbody>
              {appointments.map((a) => (
                <tr key={a.id}>
                  <td style={{ borderBottom: "1px solid #f0f0f0", padding: 8 }}>
                    {a.startTime.slice(0, 16).replace("T", " ")}
                  </td>
                  <td style={{ borderBottom: "1px solid #f0f0f0", padding: 8 }}>
                    {a.endTime.slice(0, 16).replace("T", " ")}
                  </td>
                  <td style={{ borderBottom: "1px solid #f0f0f0", padding: 8 }}>
                    {a.status}
                  </td>
                  <td style={{ borderBottom: "1px solid #f0f0f0", padding: 8 }}>
                    {a.providerId}
                  </td>
                  <td style={{ borderBottom: "1px solid #f0f0f0", padding: 8 }}>
                    {a.room ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  } catch {
    return (
      <p style={{ marginTop: 12, color: "#b00020" }}>
        Failed to load appointments.
      </p>
    );
  }
}

async function VitalsSection({
  vitalsPromise,
}: {
  vitalsPromise: Promise<PatientsApiResponse<VitalReading[]>>;
}) {
  try {
    const { data } = await vitalsPromise;
    return <VitalsChart readings={data ?? []} />;
  } catch {
    return (
      <p style={{ marginTop: 12, color: "#b00020" }}>
        Failed to load vitals.
      </p>
    );
  }
}

async function NotesSection({
  patientId,
  notesPromise,
}: {
  patientId: string;
  notesPromise: Promise<PatientsApiResponse<Note[]>>;
}) {
  try {
    const { data } = await notesPromise;
    return <NotesSectionClient patientId={patientId} initialNotes={data ?? []} />;
  } catch {
    return (
      <p style={{ marginTop: 12, color: "#b00020" }}>
        Failed to load notes.
      </p>
    );
  }
}

export default async function PatientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const tab = getTab(sp);

  const patientPromise = fetchJson<Patient>(`/api/patients/${id}`);
  const appointmentsPromise =
    tab === "appointments" || tab === "overview"
      ? fetchJson<PatientsApiResponse<Appointment[]>>(
          `/api/patients/${id}/appointments`
        )
      : null;
  const vitalsPromise =
    tab === "vitals"
      ? fetchJson<PatientsApiResponse<VitalReading[]>>(
          `/api/patients/${id}/vitals`
        )
      : null;
  const notesPromise =
    tab === "notes"
      ? fetchJson<PatientsApiResponse<Note[]>>(`/api/patients/${id}/notes`)
      : null;

  const tabLink = (key: TabKey, label: string) => (
    <Link
      href={`/patients/${id}?tab=${key}`}
      style={{
        padding: "6px 10px",
        borderRadius: 6,
        textDecoration: "none",
        color: tab === key ? "#111" : "inherit",
        background: tab === key ? "#f5f5f5" : "transparent",
        border: tab === key ? "1px solid #d8d8d8" : "1px solid transparent",
        boxShadow: tab === key ? "0 1px 0 rgba(0,0,0,0.08)" : "none",
      }}
    >
      {label}
    </Link>
  );

  return (
    <main style={{ padding: 24 }}>
      <h1>Patient Detail</h1>

      <SectionErrorBoundary
        fallback={
          <p style={{ marginTop: 12, color: "#b00020" }}>
            Header failed to render.
          </p>
        }
      >
        <Suspense fallback={<SectionSkeleton lines={4} />}>
          <PatientHeader patientPromise={patientPromise!} />
        </Suspense>
      </SectionErrorBoundary>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        {tabLink("overview", "Overview")}
        {tabLink("appointments", "Appointments")}
        {tabLink("vitals", "Vitals")}
        {tabLink("notes", "Notes")}
      </div>

      {tab === "overview" && (
        <SectionErrorBoundary
          fallback={
            <p style={{ marginTop: 12, color: "#b00020" }}>
              Overview failed to render.
            </p>
          }
        >
          <Suspense
            fallback={
              <div
                style={{
                  marginTop: 12,
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: 12,
                }}
              >
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      height: 92,
                      borderRadius: 10,
                      background: "#1f1f1f",
                      border: "1px solid #2a2a2a",
                    }}
                  />
                ))}
              </div>
            }
          >
            <OverviewSection
              patientPromise={patientPromise!}
              appointmentsPromise={appointmentsPromise!}
            />
          </Suspense>
        </SectionErrorBoundary>
      )}

      {tab === "appointments" && (
        <SectionErrorBoundary
          fallback={
            <p style={{ marginTop: 12, color: "#b00020" }}>
              Appointments failed to render.
            </p>
          }
        >
          <Suspense fallback={<SectionSkeleton lines={6} />}>
            <AppointmentsSection appointmentsPromise={appointmentsPromise!} />
          </Suspense>
        </SectionErrorBoundary>
      )}

      {tab === "vitals" && (
        <SectionErrorBoundary
          fallback={
            <p style={{ marginTop: 12, color: "#b00020" }}>
              Vitals failed to render.
            </p>
          }
        >
          <Suspense fallback={<SectionSkeleton lines={5} />}>
            <VitalsSection vitalsPromise={vitalsPromise!} />
          </Suspense>
        </SectionErrorBoundary>
      )}

      {tab === "notes" && (
        <SectionErrorBoundary
          fallback={
            <p style={{ marginTop: 12, color: "#b00020" }}>
              Notes failed to render.
            </p>
          }
        >
          <Suspense fallback={<SectionSkeleton lines={4} />}>
            <NotesSection patientId={id} notesPromise={notesPromise!} />
          </Suspense>
        </SectionErrorBoundary>
      )}
    </main>
  );
}
