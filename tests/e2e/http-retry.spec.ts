import { test, expect } from "@playwright/test";
import { fetchJsonWithRetry } from "../../lib/http";

test("fetchJsonWithRetry retries transient failures", async () => {
  const originalFetch = global.fetch;
  let calls = 0;

  try {
    global.fetch = (async () => {
      calls += 1;
      if (calls < 3) {
        return new Response("temporary", { status: 503 });
      }
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    const data = await fetchJsonWithRetry<{ ok: boolean }>(
      "http://example.test",
      {},
      { retries: 3, backoffMs: 5 }
    );

    expect(data.ok).toBe(true);
    expect(calls).toBe(3);
  } finally {
    global.fetch = originalFetch;
  }
});
