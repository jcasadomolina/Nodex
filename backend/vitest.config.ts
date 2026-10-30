import { defineConfig } from "vitest/config";
import { testEnv } from "./src/test/database.js";

export default defineConfig({
  test: {
    env: testEnv(),
    globalSetup: "src/test/global-setup.ts",
    maxWorkers: 2,
    testTimeout: 30_000,
    hookTimeout: 120_000,
  },
});
