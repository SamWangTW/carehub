import { withLatency, maybeFail } from "../../../lib/fakeNetwork";
import { providers } from "../../../mocks/providers";

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

export async function GET() {
  await maybeSimulate();
  return Response.json({ data: providers });
}
