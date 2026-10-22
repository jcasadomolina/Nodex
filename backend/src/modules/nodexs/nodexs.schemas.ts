import { z } from "zod";

const nodexType = z.enum(["note", "link"]);

const fields = {
  title: z.string().trim().min(1, "El título es obligatorio").max(200),
  content: z.string().max(50_000).nullable().optional(),
  url: z.url({ protocol: /^https?$/, error: "La URL debe empezar por http:// o https://" }).nullable().optional(),
};

export const createNodexSchema = z
  .object({
    type: nodexType,
    ...fields,
    groupIds: z.array(z.uuid()).max(50).default([]),
  })
  .refine((data) => data.type !== "link" || data.url, {
    message: "Los enlaces necesitan una URL",
    path: ["url"],
  });

export const updateNodexSchema = z.object(fields).partial();

export const listNodexsSchema = z.object({
  groupId: z.uuid().optional(),
  orphan: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  type: nodexType.optional(),
  cursor: z.uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
