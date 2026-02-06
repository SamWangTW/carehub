import { defineConfig } from "@playwright/test";

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 10_000,
  webServer: {
    command: "npm run dev",
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_E2E: "1",
      NEXT_PUBLIC_NOTIF_POLL_MS: "300",
    },
  },
  use: {
    baseURL: `http://localhost:${PORT}`,
  },
});
