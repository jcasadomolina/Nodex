import { Router } from "express";
import type { Prisma } from "../../../generated/prisma/client.js";
import { HttpError } from "../../lib/http-error.js";
import { parseId } from "../../lib/params.js";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middleware/require-auth.js";
import { processInBackground } from "../ai/ai.service.js";
import { createNodexSchema, listNodexsSchema, updateNodexSchema } from "./nodexs.schemas.js";

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
  metadata: true,
  createdAt: true,
  updatedAt: true,
  groups: { where: { group: { deletedAt: null } }, select: { groupId: true } },
} as const;

type NodexRow = Prisma.NodexGetPayload<{ select: typeof nodexFields }>;

export function toNodex({ groups, ...nodex }: NodexRow) {
  return { ...nodex, groupIds: groups.map((g) => g.groupId) };
}

async function findNodex(userId: string, id: string) {
  const nodex = await prisma.nodex.findFirst({ where: { id, userId, deletedAt: null }, select: nodexFields });
  if (!nodex) {
    throw new HttpError(404, NODEX_NOT_FOUND);
  }
  return nodex;
}

nodexsRouter.get("/", async (req, res) => {
  const { groupId, orphan, type, cursor, limit } = listNodexsSchema.parse(req.query);
  const activeGroup = { group: { deletedAt: null } };

  const nodexs = await prisma.nodex.findMany({
    where: {
      userId: req.session.userId!,
      deletedAt: null,
      type,
      groups: groupId ? { some: { groupId, ...activeGroup } } : orphan ? { none: activeGroup } : undefined,
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
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
  processInBackground(userId, nodex.id);
  res.status(201).json({ nodex: toNodex(nodex) });
});

nodexsRouter.get("/:id", async (req, res) => {
  const id = parseId(req.params.id, NODEX_NOT_FOUND);
  const nodex = await findNodex(req.session.userId!, id);
  res.json({ nodex: toNodex(nodex) });
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
