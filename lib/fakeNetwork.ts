/**
 * Sleep for a given number of milliseconds.
 * Used to simulate network delay.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Simulate network latency between 200–500ms.
 * Call this before returning API data.
 */
export async function withLatency(
  minMs: number = 200,
  maxMs: number = 500
): Promise<void> {
  const delay =
    Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;

  await sleep(delay);
}

/**
 * Randomly throw an error to simulate backend failure.
 * Example: maybeFail(0.05) → 5% chance to throw.
 */
export function maybeFail(failureRate: number): void {
  if (Math.random() < failureRate) {
    throw new Error("Simulated network error");
  }
}
