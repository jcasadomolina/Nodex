import { z } from "zod";

const nodexType = z.enum(["note", "link"]);

export const PRIORITIES = ["low", "medium", "high", "urgent"] as const;

const priorityName = z.enum(PRIORITIES);

export function priorityToNumber(priority: (typeof PRIORITIES)[number]) {
  return PRIORITIES.indexOf(priority) + 1;
}

export function priorityToName(value: number | null) {
  return value ? PRIORITIES[value - 1]! : null;
}

const fields = {
  title: z.string().trim().min(1, "El título es obligatorio").max(200),
  content: z.string().max(50_000).nullable().optional(),
  url: z.url({ protocol: /^https?$/, error: "La URL debe empezar por http:// o https://" }).nullable().optional(),
  priority: priorityName
    .nullable()
    .optional()
    .transform((p) => (p ? priorityToNumber(p) : p)),
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
  priority: priorityName.transform(priorityToNumber).optional(),
  sort: z.enum(["recent", "priority"]).default("recent"),
  cursor: z.uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
