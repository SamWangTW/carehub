export async function GET() {
  const patients = [
    { id: "p001", name: "Alice Johnson", age: 34, gender: "F", lastVisit: "2025-12-12" },
    { id: "p002", name: "Brian Lee", age: 58, gender: "M", lastVisit: "2026-01-05" },
    { id: "p003", name: "Carla Gomez", age: 41, gender: "F", lastVisit: "2026-01-20" },
    { id: "p004", name: "David Kim", age: 29, gender: "M", lastVisit: "2025-11-02" },
    { id: "p005", name: "Evelyn Smith", age: 67, gender: "F", lastVisit: "2026-01-18" },
  ];

  return Response.json({
    data: patients,
    total: patients.length,
  });
}
