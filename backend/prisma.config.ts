import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// El .env vive en la raíz del repositorio, un nivel por encima de backend/
config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // La CLI (migraciones) usa la conexión directa; la aplicación usará la de pooling
    url: env("DIRECT_URL"),
  },
});
