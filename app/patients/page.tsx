type Patient = {
  id: string;
  name: string;
  age: number;
  gender: string;
  lastVisit: string;
};

type PatientsApiResponse = {
  data: Patient[];
  total: number;
};

export default async function PatientsPage() {
  // IMPORTANT: absolute URL avoids edge cases in server fetch
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  const res = await fetch(`${baseUrl}/api/patients`, {
    // For Day 1: don't worry about caching rules yet
    cache: "no-store",
  });

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

  return (
    <main style={{ padding: 24 }}>
      <h1>Patients</h1>
      <p>Total: {json.total}</p>

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
        <thead>
          <tr>
            <th style={{ borderBottom: "1px solid #ddd", textAlign: "left", padding: 8 }}>ID</th>
            <th style={{ borderBottom: "1px solid #ddd", textAlign: "left", padding: 8 }}>Name</th>
            <th style={{ borderBottom: "1px solid #ddd", textAlign: "left", padding: 8 }}>Age</th>
            <th style={{ borderBottom: "1px solid #ddd", textAlign: "left", padding: 8 }}>Gender</th>
            <th style={{ borderBottom: "1px solid #ddd", textAlign: "left", padding: 8 }}>Last Visit</th>
          </tr>
        </thead>

        <tbody>
          {patients.map((p) => (
            <tr key={p.id}>
              <td style={{ borderBottom: "1px solid #f0f0f0", padding: 8 }}>{p.id}</td>
              <td style={{ borderBottom: "1px solid #f0f0f0", padding: 8 }}>{p.name}</td>
              <td style={{ borderBottom: "1px solid #f0f0f0", padding: 8 }}>{p.age}</td>
              <td style={{ borderBottom: "1px solid #f0f0f0", padding: 8 }}>{p.gender}</td>
              <td style={{ borderBottom: "1px solid #f0f0f0", padding: 8 }}>{p.lastVisit}</td>
            </tr>
          ))}

          {patients.length === 0 && (
            <tr>
              <td colSpan={5} style={{ padding: 12 }}>
                No patients found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
