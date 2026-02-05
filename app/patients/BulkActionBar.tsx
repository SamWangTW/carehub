"use client";

import type { Patient } from "../../types/patient";

export default function BulkActionBar({
  selectedPatients,
  onClear,
}: {
  selectedPatients: Patient[];
  onClear: () => void;
}) {
  const count = selectedPatients.length;

  function exportSelected() {
    const blob = new Blob([JSON.stringify(selectedPatients, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `carehub_patients_export_${count}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  }

  function sendMessage() {
    alert(`Mock: message sent to ${count} patient(s).`);
  }

  return (
    <div
      style={{
        marginTop: 12,
        padding: 12,
        border: "1px solid #333",
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <strong>{count}</strong>
        <span style={{ opacity: 0.85 }}>selected</span>
        <button
          type="button"
          onClick={onClear}
          style={{
            padding: "6px 10px",
            border: "1px solid #555",
            borderRadius: 8,
            background: "#111",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Clear
        </button>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={exportSelected}
          style={{
            padding: "8px 12px",
            border: "1px solid #ccc",
            borderRadius: 8,
            background: "#111",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Export selected (mock)
        </button>

        <button
          type="button"
          onClick={sendMessage}
          style={{
            padding: "8px 12px",
            border: "1px solid #ccc",
            borderRadius: 8,
            background: "#111",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Send message (mock)
        </button>
      </div>
    </div>
  );
}