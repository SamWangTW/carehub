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

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
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

  const sp = await searchParams;

  const safePage = parsePositiveInt(sp.page, 1);
  const safeLimit = parsePositiveInt(sp.limit, 10);

  const res = await fetch(
    `${baseUrl}/api/patients?page=${safePage}&limit=${safeLimit}`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Patients</h1>
        <p>Failed to load patients (HTTP {res.status}).</p>
      </main>
    );
  }

  const json = (await res.json()) as PatientsApiResponse;
  const patients = json.data ?? [];
  const pagination = json.pagination;

  return (
    <main style={{ padding: 24 }}>
      <h1>Patients</h1>

      <p>
        Total: {pagination.total} • Page {pagination.page} of{" "}
        {pagination.totalPages} • Page size: {pagination.limit}
      </p>

      <table
        style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}
      >
        <thead>
          <tr>
            <th style={{ borderBottom: "1px solid #ddd", textAlign: "left", padding: 8 }}>
              ID
            </th>
            <th style={{ borderBottom: "1px solid #ddd", textAlign: "left", padding: 8 }}>
              Name
            </th>
            <th style={{ borderBottom: "1px solid #ddd", textAlign: "left", padding: 8 }}>
              MRN
            </th>
            <th style={{ borderBottom: "1px solid #ddd", textAlign: "left", padding: 8 }}>
              DOB
            </th>
            <th style={{ borderBottom: "1px solid #ddd", textAlign: "left", padding: 8 }}>
              Status
            </th>
            <th style={{ borderBottom: "1px solid #ddd", textAlign: "left", padding: 8 }}>
              Risk
            </th>
            <th style={{ borderBottom: "1px solid #ddd", textAlign: "left", padding: 8 }}>
              Provider ID
            </th>
          </tr>
        </thead>

        <tbody>
          {patients.map((p) => (
            <tr key={p.id}>
              <td style={{ borderBottom: "1px solid #f0f0f0", padding: 8 }}>
                {p.id}
              </td>
              <td style={{ borderBottom: "1px solid #f0f0f0", padding: 8 }}>
                {p.firstName} {p.lastName}
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
          ))}

          {patients.length === 0 && (
            <tr>
              <td colSpan={7} style={{ padding: 12 }}>
                No patients found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
