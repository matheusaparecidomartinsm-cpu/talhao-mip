import { defineConfig } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 3100);
export default defineConfig({
  testDir: "e2e",
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    viewport: { width: 390, height: 844 },
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    launchOptions: { executablePath: process.env.CHROME ?? "/usr/bin/google-chrome", args: ["--no-sandbox"] },
    trace: "retain-on-failure",
  },
  webServer: process.env.NO_SERVER ? undefined : {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/biblioteca`,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
