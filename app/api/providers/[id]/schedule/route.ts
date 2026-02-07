import { withLatency, maybeFail } from "../../../../../lib/fakeNetwork";
import { providers } from "../../../../../mocks/providers";

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

  const provider = providers.find((p) => p.id === id);
  if (!provider) {
    return Response.json({ error: "Provider not found" }, { status: 404 });
  }

  const { workDays, startHour, endHour } = provider;
  return Response.json({
    data: { id: provider.id, workDays, startHour, endHour },
  });
}
