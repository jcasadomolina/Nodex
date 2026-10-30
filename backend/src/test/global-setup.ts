import { execSync } from "node:child_process";
import { assertLocalDatabase, testEnv } from "./database.js";

export default function setup() {
  const env = testEnv();
  try {
    assertLocalDatabase(env);
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }
  execSync("npx prisma migrate deploy", { stdio: "inherit", env: { ...process.env, ...env } });
}
