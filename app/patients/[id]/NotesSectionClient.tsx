"use client";

import { useState } from "react";
import type { Note } from "../../../types/note";

type Props = {
  patientId: string;
  initialNotes: Note[];
};

export default function NotesSectionClient({ patientId, initialNotes }: Props) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const normalizeNoteText = (value: string) =>
    value
      .replace(/Ã¢â‚¬Â¢|â€¢/g, " - ")
      .replace(/Ã¢â‚¬â€œ|â€“/g, "-")
      .replace(/Ã¢â‚¬â€�|â€”/g, "--");

  async function addNote() {
    const trimmed = text.trim();
    if (!trimmed || saving) return;

    const optimistic: Note = {
      id: `temp-${Date.now()}`,
      patientId,
      author: "You",
      text: trimmed,
      createdAt: new Date().toISOString(),
    };

    setNotes((prev) => [optimistic, ...prev]);
    setText("");
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/patients/${patientId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed, author: "You" }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Failed to add note.");
      }

      const saved = (await res.json()) as Note;
      setNotes((prev) =>
        prev.map((n) => (n.id === optimistic.id ? saved : n))
      );
    } catch (err) {
      setNotes((prev) => prev.filter((n) => n.id !== optimistic.id));
      setError(err instanceof Error ? err.message : "Failed to add note.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          placeholder="Add a note..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ flex: 1, padding: 8 }}
        />
        <button
          type="button"
          onClick={addNote}
          disabled={saving || !text.trim()}
          style={{
            padding: "8px 12px",
            borderRadius: 6,
            border: "1px solid #2a2a2a",
            background:
              saving || !text.trim() ? "#2a2a2a" : "rgba(255,255,255,0.08)",
            color: saving || !text.trim() ? "#777" : "#e6e6e6",
            cursor: saving || !text.trim() ? "not-allowed" : "pointer",
          }}
          onMouseEnter={(e) => {
            if (saving || !text.trim()) return;
            e.currentTarget.style.background = "rgba(255,255,255,0.16)";
            e.currentTarget.style.textDecoration = "underline";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.08)";
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
          {saving ? "Adding..." : "Add Note"}
        </button>
      </div>

      {error && <p style={{ color: "#b00020" }}>{error}</p>}

      {notes.length === 0 ? (
        <p style={{ marginTop: 12 }}>No notes yet.</p>
      ) : (
        <ul style={{ paddingLeft: 16, marginTop: 12 }}>
          {notes.map((note) => (
            <li key={note.id} style={{ marginBottom: 8 }}>
              <div style={{ fontWeight: 600 }}>
                <span>{note.author}</span>
                <span style={{ color: "#9aa0a6", margin: "0 6px" }}>-</span>
                <span>{note.createdAt.slice(0, 10)}</span>
              </div>
              <div>{normalizeNoteText(note.text)}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
