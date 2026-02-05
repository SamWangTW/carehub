export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main style={{ padding: 24 }}>
      <h1>Patient Detail</h1>
      <p>Patient ID: {id}</p>
    </main>
  );
}
