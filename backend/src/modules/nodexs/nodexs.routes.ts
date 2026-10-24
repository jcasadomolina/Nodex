import { Router } from "express";
import type { Prisma } from "../../../generated/prisma/client.js";
import { HttpError } from "../../lib/http-error.js";
import { parseId } from "../../lib/params.js";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middleware/require-auth.js";
import { checkNewNodex, findRelated, processInBackground, searchNodexs } from "../ai/ai.service.js";
import { previewFields, refreshPreviewInBackground } from "../links/links.service.js";
import {
  createNodexSchema,
  listNodexsSchema,
  priorityToName,
  relatedNodexsSchema,
  searchNodexsSchema,
  updateNodexSchema,
} from "./nodexs.schemas.js";

export const nodexsRouter = Router();

nodexsRouter.use(requireAuth);

const NODEX_NOT_FOUND = "Nodex no encontrado";

export const nodexFields = {
  id: true,
  type: true,
  title: true,
  content: true,
  url: true,
  source: true,
  priority: true,
  metadata: true,
  createdAt: true,
  updatedAt: true,
  groups: { where: { group: { deletedAt: null } }, select: { groupId: true } },
  task: { select: { status: true, dueAt: true, completedAt: true } },
  reminder: { select: { remindAt: true, sentAt: true, dismissedAt: true } },
  linkPreview: { select: previewFields },
} as const;

type NodexRow = Prisma.NodexGetPayload<{ select: typeof nodexFields }>;

export function toNodex({ groups, priority, ...nodex }: NodexRow) {
  return { ...nodex, priority: priorityToName(priority), groupIds: groups.map((g) => g.groupId) };
}

async function findNodex(userId: string, id: string) {
  const nodex = await prisma.nodex.findFirst({ where: { id, userId, deletedAt: null }, select: nodexFields });
  if (!nodex) {
    throw new HttpError(404, NODEX_NOT_FOUND);
  }
  return nodex;
}

async function loadInOrder<T extends { id: string }>(userId: string, matches: T[]) {
  const nodexs = await prisma.nodex.findMany({
    where: { id: { in: matches.map((m) => m.id) }, userId, deletedAt: null },
    select: nodexFields,
  });
  const byId = new Map(nodexs.map((nodex) => [nodex.id, toNodex(nodex)]));
  return matches.flatMap(({ id, ...extra }) => {
    const nodex = byId.get(id);
    return nodex ? [{ ...nodex, ...extra }] : [];
  });
}

nodexsRouter.get("/search", async (req, res) => {
  const userId = req.session.userId!;
  const { q, limit } = searchNodexsSchema.parse(req.query);
  const matches = await searchNodexs(userId, q, limit);
  res.json({ nodexs: await loadInOrder(userId, matches) });
});

nodexsRouter.get("/", async (req, res) => {
  const { groupId, orphan, type, priority, sort, cursor, limit } = listNodexsSchema.parse(req.query);
  const activeGroup = { group: { deletedAt: null } };

  const nodexs = await prisma.nodex.findMany({
    where: {
      userId: req.session.userId!,
      deletedAt: null,
      type,
      priority,
      groups: groupId ? { some: { groupId, ...activeGroup } } : orphan ? { none: activeGroup } : undefined,
    },
    orderBy: [
      ...(sort === "priority" ? [{ priority: { sort: "desc", nulls: "last" } } as const] : []),
      { createdAt: "desc" },
      { id: "desc" },
    ],
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    select: nodexFields,
  });

  const hasMore = nodexs.length > limit;
  const page = hasMore ? nodexs.slice(0, limit) : nodexs;

  res.json({
    nodexs: page.map(toNodex),
    nextCursor: hasMore ? page.at(-1)!.id : null,
  });
});

nodexsRouter.post("/", async (req, res) => {
  const userId = req.session.userId!;
  const { groupIds, ...data } = createNodexSchema.parse(req.body);
  const uniqueGroupIds = [...new Set(groupIds)];

  const ownedGroups = await prisma.group.count({
    where: { id: { in: uniqueGroupIds }, userId, deletedAt: null },
  });
  if (ownedGroups !== uniqueGroupIds.length) {
    throw new HttpError(404, "Alguno de los grupos no existe");
  }

  const nodex = await prisma.nodex.create({
    data: {
      ...data,
      userId,
      groups: { create: uniqueGroupIds.map((groupId) => ({ groupId })) },
    },
    select: nodexFields,
  });
  if (nodex.url) refreshPreviewInBackground(nodex.id);
  const duplicates = await loadInOrder(userId, await checkNewNodex(userId, nodex.id));
  res.status(201).json({ nodex: toNodex(nodex), duplicates });
});

nodexsRouter.get("/:id", async (req, res) => {
  const id = parseId(req.params.id, NODEX_NOT_FOUND);
  const nodex = await findNodex(req.session.userId!, id);
  res.json({ nodex: toNodex(nodex) });
});

nodexsRouter.get("/:id/related", async (req, res) => {
  const userId = req.session.userId!;
  const id = parseId(req.params.id, NODEX_NOT_FOUND);
  const { limit } = relatedNodexsSchema.parse(req.query);
  await findNodex(userId, id);
  const matches = await findRelated(userId, id, limit);
  res.json({ nodexs: await loadInOrder(userId, matches) });
});

nodexsRouter.patch("/:id", async (req, res) => {
  const id = parseId(req.params.id, NODEX_NOT_FOUND);
  const data = updateNodexSchema.parse(req.body);
  const current = await findNodex(req.session.userId!, id);

  if (current.type === "link" && data.url === null) {
    throw new HttpError(400, "Los enlaces necesitan una URL");
  }

  const nodex = await prisma.nodex.update({ where: { id }, data, select: nodexFields });
  if (data.title !== undefined || data.content !== undefined || data.url !== undefined) {
    processInBackground(req.session.userId!, id);
  }
  if (data.url !== undefined) refreshPreviewInBackground(id);
  res.json({ nodex: toNodex(nodex) });
});

nodexsRouter.delete("/:id", async (req, res) => {
  const id = parseId(req.params.id, NODEX_NOT_FOUND);
  const { count } = await prisma.nodex.updateMany({
    where: { id, userId: req.session.userId!, deletedAt: null },
    data: { deletedAt: new Date() },
  });

  if (count === 0) {
    throw new HttpError(404, NODEX_NOT_FOUND);
  }
  res.status(204).end();
});
