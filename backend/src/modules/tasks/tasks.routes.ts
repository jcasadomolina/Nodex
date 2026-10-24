import { Router } from "express";
import { HttpError } from "../../lib/http-error.js";
import { parseId } from "../../lib/params.js";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middleware/require-auth.js";
import { priorityToName } from "../nodexs/nodexs.schemas.js";
import { calendarSchema, moveTaskSchema, TASK_STATUSES, upsertTaskSchema, type TaskStatus } from "./tasks.schemas.js";

export const tasksRouter = Router();

tasksRouter.use(requireAuth);

const NODEX_NOT_FOUND = "Nodex no encontrado";
const TASK_NOT_FOUND = "Ese Nodex no es una tarea";

const taskFields = { status: true, dueAt: true, completedAt: true } as const;

const cardFields = {
  ...taskFields,
  nodex: { select: { id: true, title: true, type: true, url: true, priority: true } },
} as const;

type Card = { nodex: { priority: number | null } };

function toCard<T extends Card>({ nodex, ...task }: T) {
  return { ...task, nodex: { ...nodex, priority: priorityToName(nodex.priority) } };
}

const activeNodex = { nodex: { deletedAt: null } };

async function lastPosition(userId: string, status: TaskStatus) {
  const last = await prisma.task.findFirst({
    where: { userId, status },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  return (last?.position ?? 0) + 1;
}

function completedAtFor(status: TaskStatus) {
  return status === "done" ? new Date() : null;
}

tasksRouter.get("/board", async (req, res) => {
  const tasks = await prisma.task.findMany({
    where: { userId: req.session.userId!, ...activeNodex },
    orderBy: { position: "asc" },
    select: cardFields,
  });

  const columns = Object.fromEntries(
    TASK_STATUSES.map((status) => [status, tasks.filter((t) => t.status === status).map(toCard)]),
  );
  res.json({ columns });
});

tasksRouter.get("/calendar", async (req, res) => {
  const { from, to } = calendarSchema.parse(req.query);

  const tasks = await prisma.task.findMany({
    where: { userId: req.session.userId!, ...activeNodex, dueAt: { gte: from, lt: to } },
    orderBy: { dueAt: "asc" },
    select: cardFields,
  });
  res.json({ tasks: tasks.map(toCard) });
});

tasksRouter.put("/:nodexId", async (req, res) => {
  const userId = req.session.userId!;
  const nodexId = parseId(req.params.nodexId, NODEX_NOT_FOUND);
  const data = upsertTaskSchema.parse(req.body);

  const nodex = await prisma.nodex.findFirst({ where: { id: nodexId, userId, deletedAt: null } });
  if (!nodex) {
    throw new HttpError(404, NODEX_NOT_FOUND);
  }

  const existing = await prisma.task.findUnique({ where: { nodexId } });

  if (!existing) {
    const status = data.status ?? "todo";
    const task = await prisma.task.create({
      data: {
        nodexId,
        userId,
        status,
        dueAt: data.dueAt ?? null,
        position: await lastPosition(userId, status),
        completedAt: completedAtFor(status),
      },
      select: taskFields,
    });
    res.status(201).json({ task });
    return;
  }

  const statusChanged = data.status !== undefined && data.status !== existing.status;
  const task = await prisma.task.update({
    where: { nodexId },
    data: {
      dueAt: data.dueAt,
      ...(statusChanged && {
        status: data.status,
        position: await lastPosition(userId, data.status!),
        completedAt: completedAtFor(data.status!),
      }),
    },
    select: taskFields,
  });
  res.json({ task });
});

tasksRouter.delete("/:nodexId", async (req, res) => {
  const nodexId = parseId(req.params.nodexId, NODEX_NOT_FOUND);
  const { count } = await prisma.task.deleteMany({ where: { nodexId, userId: req.session.userId! } });

  if (count === 0) {
    throw new HttpError(404, TASK_NOT_FOUND);
  }
  res.status(204).end();
});

tasksRouter.post("/:nodexId/move", async (req, res) => {
  const userId = req.session.userId!;
  const nodexId = parseId(req.params.nodexId, NODEX_NOT_FOUND);
  const { status, index } = moveTaskSchema.parse(req.body);

  const task = await prisma.task.findFirst({ where: { nodexId, userId, ...activeNodex } });
  if (!task) {
    throw new HttpError(404, TASK_NOT_FOUND);
  }

  const column = await prisma.task.findMany({
    where: { userId, status, nodexId: { not: nodexId }, ...activeNodex },
    orderBy: { position: "asc" },
    select: { position: true },
  });

  const target = Math.min(index, column.length);
  const before = column[target - 1]?.position;
  const after = column[target]?.position;
  const position =
    before === undefined && after === undefined
      ? 1
      : before === undefined
        ? after! - 1
        : after === undefined
          ? before + 1
          : (before + after) / 2;

  const updated = await prisma.task.update({
    where: { nodexId },
    data: {
      status,
      position,
      ...(status !== task.status && { completedAt: completedAtFor(status) }),
    },
    select: taskFields,
  });
  res.json({ task: updated });
});
