import { z } from "zod";

// Variables de entorno que necesita el backend. Si falta alguna o tiene un
// formato incorrecto, el servidor no arranca: mejor fallar al inicio que a
// mitad de una petición.
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.url(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Variables de entorno no válidas:");
  console.error(z.prettifyError(parsed.error));
  process.exit(1);
}

export const env = parsed.data;
