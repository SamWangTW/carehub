import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: 24 }}>
      <h1>CareHub Dashboard</h1>

      <ul>
        <li>
          <Link href="/patients">Patients</Link>
        </li>
        <li>
          <Link href="/patients/123">Patient Detail (example)</Link>
        </li>
        <li>
          <Link href="/schedule">Schedule</Link>
        </li>
      </ul>
    </main>
  );
}
