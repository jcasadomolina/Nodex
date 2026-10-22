import { z } from "zod";

export const createGroupSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(80),
  description: z.string().trim().max(500).nullable().optional(),
});

export const updateGroupSchema = createGroupSchema.partial();

export const addNodexSchema = z.object({
  nodexId: z.uuid("Nodex no válido"),
});
