import { z } from "zod";

export const TASK_STATUSES = ["todo", "doing", "done"] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

const status = z.enum(TASK_STATUSES);

const date = z.iso.datetime({ offset: true }).transform((value) => new Date(value));

export const upsertTaskSchema = z.object({
  status: status.optional(),
  dueAt: date.nullable().optional(),
});

export const moveTaskSchema = z.object({
  status,
  index: z.number().int().min(0),
});

const MAX_CALENDAR_DAYS = 100;

export const calendarSchema = z
  .object({ from: date, to: date })
  .refine(({ from, to }) => to > from, { message: "'to' debe ser posterior a 'from'", path: ["to"] })
  .refine(({ from, to }) => to.getTime() - from.getTime() <= MAX_CALENDAR_DAYS * 24 * 60 * 60 * 1000, {
    message: `El rango no puede superar ${MAX_CALENDAR_DAYS} días`,
    path: ["to"],
  });
