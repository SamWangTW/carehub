"use client";

import { useState } from "react";
import type { Note } from "../../../types/note";
import { fetchJsonWithRetry } from "../../../lib/http";
import NotesRenderer from "./NotesRenderer";

type Props = {
  patientId: string;
  initialNotes: Note[];
};

export default function NotesSectionClient({ patientId, initialNotes }: Props) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

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
      const saved = await fetchJsonWithRetry<Note>(
        `/api/patients/${patientId}/notes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: trimmed, author: "You" }),
        },
        { retries: 2, backoffMs: 200 }
      );
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
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button
          type="button"
          data-testid="patient-note-preview-toggle"
          onClick={() => setShowPreview((prev) => !prev)}
          style={{
            padding: "6px 10px",
            borderRadius: 6,
            border: "1px solid #2a2a2a",
            background: "rgba(255,255,255,0.06)",
            color: "#e6e6e6",
            cursor: "pointer",
          }}
        >
          {showPreview ? "Hide Preview" : "Show Preview"}
        </button>
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
        <div style={{ flex: 1 }}>
          <textarea
            data-testid="patient-note-input"
            placeholder="Add a note (Markdown supported)..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{ width: "100%", padding: 8, minHeight: 120 }}
          />
          <button
            data-testid="patient-note-submit"
            type="button"
            onClick={addNote}
            disabled={saving || !text.trim()}
            style={{
              marginTop: 8,
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
        {showPreview && (
          <div
            data-testid="patient-note-preview"
            style={{
              flex: 1,
              border: "1px solid #2a2a2a",
              borderRadius: 6,
              padding: 8,
              background: "rgba(255,255,255,0.04)",
              minHeight: 120,
            }}
          >
            {text.trim() ? (
              <NotesRenderer markdown={normalizeNoteText(text)} />
            ) : (
              <p style={{ color: "#9aa0a6" }}>Preview will appear here.</p>
            )}
          </div>
        )}
      </div>

      {error && <p style={{ color: "#b00020" }}>{error}</p>}

      {notes.length === 0 ? (
        <p style={{ marginTop: 12 }}>No notes yet.</p>
      ) : (
        <ul style={{ paddingLeft: 16, marginTop: 12 }} data-testid="patient-notes-list">
          {notes.map((note) => (
            <li key={note.id} style={{ marginBottom: 8 }}>
              <div style={{ fontWeight: 600 }}>
                <span>{note.author}</span>
                <span style={{ color: "#9aa0a6", margin: "0 6px" }}>-</span>
                <span>{note.createdAt.slice(0, 10)}</span>
              </div>
              <div>
                <NotesRenderer markdown={normalizeNoteText(note.text)} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
