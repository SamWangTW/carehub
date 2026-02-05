import { withLatency, maybeFail } from "../../../../../lib/fakeNetwork";
import { appointments } from "../../../../../mocks/appointments";

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

  const data = appointments
    .filter((a) => a.patientId === id)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return Response.json({ data });
}
