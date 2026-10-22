import { z } from "zod";

const email = z.string().trim().toLowerCase().pipe(z.email("Email no válido"));

export const registerSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(80),
  email,
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(128),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "La contraseña es obligatoria"),
});
