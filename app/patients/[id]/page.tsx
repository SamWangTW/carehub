type PageProps = {
  params: { id: string };
};

export default function PatientDetailPage({ params }: PageProps) {
  return (
    <main style={{ padding: 24 }}>
      <h1>Patient Detail</h1>
      <p>Patient ID: {params.id}</p>
    </main>
  );
}
