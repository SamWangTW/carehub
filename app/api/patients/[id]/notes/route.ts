import { withLatency, maybeFail } from "../../../../../lib/fakeNetwork";
import { notes } from "../../../../../mocks/notes";
import type { Note } from "../../../../../types/note";

async function maybeSimulate() {
  const latencyOn = process.env.NEXT_PUBLIC_FAKE_LATENCY === "1";
  const errorRate = Number(process.env.NEXT_PUBLIC_FAKE_ERROR_RATE ?? "0");

  if (latencyOn) {
    await withLatency();
  }

  if (errorRate > 0) {
    maybeFail(errorRate);
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await maybeSimulate();
  const { id } = await params;

  const data = notes
    .filter((n) => n.patientId === id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return Response.json({ data });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await maybeSimulate();
  const { id } = await params;

  let body: Partial<Note>;
  try {
    body = (await req.json()) as Partial<Note>;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return Response.json({ error: "Note text is required" }, { status: 400 });
  }

  const author =
    typeof body.author === "string" && body.author.trim().length > 0
      ? body.author.trim()
      : "System";

  const createdAt = new Date().toISOString();
  const noteId = `note-${String(notes.length + 1).padStart(4, "0")}`;

  const note: Note = {
    id: noteId,
    patientId: id,
    author,
    text,
    createdAt,
  };

  notes.push(note);

  return Response.json(note, { status: 201 });
}
