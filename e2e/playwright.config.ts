import { defineConfig, devices } from "@playwright/test";

const TEST_DATABASE_URL = "postgresql://nodex:nodex@localhost:5433/nodex_test";

export default defineConfig({
  testDir: ".",
  timeout: 120_000,
  expect: { timeout: 15_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:3100",
    trace: "on-first-retry",
  },
  projects: [
    { name: "preparar", testMatch: /preparar\.setup\.ts/ },
    {
      name: "escritorio",
      testIgnore: /movil\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], storageState: ".auth/usuario.json" },
      dependencies: ["preparar"],
    },
    {
      name: "movil",
      testMatch: /movil\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, storageState: ".auth/usuario.json" },
      dependencies: ["preparar"],
    },
  ],
  webServer: [
    {
      command: "npx prisma migrate deploy && npx tsx src/server.ts",
      cwd: "../backend",
      url: "http://localhost:4100/api/health",
      reuseExistingServer: false,
      timeout: 180_000,
      env: {
        NODE_ENV: "test",
        PORT: "4100",
        APP_URL: "http://localhost:3100",
        DATABASE_URL: TEST_DATABASE_URL,
        DIRECT_URL: TEST_DATABASE_URL,
        SESSION_SECRET: "secreto-de-pruebas-que-no-se-usa-en-produccion",
      },
    },
    {
      command: "npx next build && npx next start -p 3100",
      cwd: "../frontend",
      url: "http://localhost:3100/login",
      reuseExistingServer: false,
      timeout: 300_000,
      env: { BACKEND_URL: "http://localhost:4100" },
    },
  ],
});
