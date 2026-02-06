import { insert } from "../../../../../lib/mock-db/notifications";
import type { Notification } from "../../../../../types/notification";

const allowed =
  process.env.NODE_ENV === "test" || process.env.NEXT_PUBLIC_E2E === "1";

const typeMap: Record<string, Notification["type"]> = {
  appointment: "appointment",
  "patient-alert": "patient_alert",
  patient_alert: "patient_alert",
  message: "message",
};

export async function POST(req: Request) {
  if (!allowed) {
    return new Response("Not found", { status: 404 });
  }

  let body: Partial<Notification> = {};
  try {
    body = (await req.json()) as Partial<Notification>;
  } catch {
    body = {};
  }

  const type = typeMap[String(body.type ?? "message")] ?? "message";
  const createdAt = new Date().toISOString();

  const inserted = insert({
    type,
    title: body.title ?? "E2E Notification",
    body: body.body,
    href: body.href,
    createdAt,
    readAt: null,
  });

  return Response.json({ data: inserted }, { status: 201 });
}
