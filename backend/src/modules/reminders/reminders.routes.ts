import { Router } from "express";
import { z } from "zod";
import { HttpError } from "../../lib/http-error.js";
import { parseId } from "../../lib/params.js";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middleware/require-auth.js";
import { priorityToName } from "../nodexs/nodexs.schemas.js";

export const remindersRouter = Router();

remindersRouter.use(requireAuth);

const NODEX_NOT_FOUND = "Nodex no encontrado";
const REMINDER_NOT_FOUND = "Ese Nodex no tiene recordatorio";

const reminderFields = { remindAt: true, sentAt: true, dismissedAt: true } as const;

const setReminderSchema = z.object({
  remindAt: z.iso
    .datetime({ offset: true })
    .transform((value) => new Date(value))
    .refine((date) => date > new Date(), { message: "El recordatorio debe ser en el futuro" }),
});

const listSchema = z.object({
  status: z.enum(["upcoming", "due"]).default("upcoming"),
});

remindersRouter.get("/", async (req, res) => {
  const { status } = listSchema.parse(req.query);
  const now = new Date();

  const reminders = await prisma.reminder.findMany({
    where: {
      userId: req.session.userId!,
      nodex: { deletedAt: null },
      ...(status === "upcoming" ? { remindAt: { gt: now } } : { remindAt: { lte: now }, dismissedAt: null }),
    },
    orderBy: { remindAt: status === "upcoming" ? "asc" : "desc" },
    select: {
      ...reminderFields,
      nodex: { select: { id: true, title: true, type: true, priority: true } },
    },
  });

  res.json({
    reminders: reminders.map(({ nodex, ...reminder }) => ({
      ...reminder,
      nodex: { ...nodex, priority: priorityToName(nodex.priority) },
    })),
  });
});

remindersRouter.put("/:nodexId", async (req, res) => {
  const userId = req.session.userId!;
  const nodexId = parseId(req.params.nodexId, NODEX_NOT_FOUND);
  const { remindAt } = setReminderSchema.parse(req.body);

  const nodex = await prisma.nodex.findFirst({ where: { id: nodexId, userId, deletedAt: null } });
  if (!nodex) {
    throw new HttpError(404, NODEX_NOT_FOUND);
  }

  const reminder = await prisma.reminder.upsert({
    where: { nodexId },
    create: { nodexId, userId, remindAt },
    update: { remindAt, sentAt: null, dismissedAt: null },
    select: reminderFields,
  });
  res.json({ reminder });
});

remindersRouter.delete("/:nodexId", async (req, res) => {
  const nodexId = parseId(req.params.nodexId, NODEX_NOT_FOUND);
  const { count } = await prisma.reminder.deleteMany({ where: { nodexId, userId: req.session.userId! } });

  if (count === 0) {
    throw new HttpError(404, REMINDER_NOT_FOUND);
  }
  res.status(204).end();
});

remindersRouter.post("/:nodexId/dismiss", async (req, res) => {
  const nodexId = parseId(req.params.nodexId, NODEX_NOT_FOUND);
  const { count } = await prisma.reminder.updateMany({
    where: { nodexId, userId: req.session.userId!, remindAt: { lte: new Date() } },
    data: { dismissedAt: new Date() },
  });

  if (count === 0) {
    throw new HttpError(404, REMINDER_NOT_FOUND);
  }
  res.status(204).end();
});
