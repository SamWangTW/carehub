type RetryOptions = {
  retries?: number;
  backoffMs?: number;
  retryOn?: number[];
};

const DEFAULT_RETRY_ON = [429, 500, 502, 503, 504];

function sleep(ms: number, signal?: AbortSignal | null) {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      resolve();
    }, ms);

    const onAbort = () => {
      cleanup();
      reject(new DOMException("Aborted", "AbortError"));
    };

    const cleanup = () => {
      clearTimeout(timer);
      if (signal) signal.removeEventListener("abort", onAbort);
    };

    if (signal) {
      if (signal.aborted) return onAbort();
      signal.addEventListener("abort", onAbort, { once: true });
    }
  });
}

async function readErrorMessage(res: Response): Promise<string> {
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      const json = (await res.json()) as { error?: string; message?: string };
      return json.error ?? json.message ?? `Request failed (${res.status})`;
    } catch {
      return `Request failed (${res.status})`;
    }
  }

  const text = await res.text().catch(() => "");
  return text || `Request failed (${res.status})`;
}

export async function fetchJsonWithRetry<T>(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<T> {
  const {
    retries = 2,
    backoffMs = 200,
    retryOn = DEFAULT_RETRY_ON,
  } = retryOptions;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const res = await fetch(url, options);

      if (res.ok) {
        return (await res.json()) as T;
      }

      if (retryOn.includes(res.status) && attempt < retries) {
        const jitter = Math.floor(Math.random() * backoffMs);
        const delay = backoffMs * 2 ** attempt + jitter;
        await sleep(delay, options.signal);
        continue;
      }

      const message = await readErrorMessage(res);
      throw new Error(message);
    } catch (err) {
      if (options.signal?.aborted) {
        throw err;
      }
      if (attempt >= retries) {
        throw err;
      }
      const jitter = Math.floor(Math.random() * backoffMs);
      const delay = backoffMs * 2 ** attempt + jitter;
      await sleep(delay, options.signal);
    }
  }

  throw new Error("Request failed");
}
