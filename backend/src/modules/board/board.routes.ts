import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middleware/require-auth.js";
import { findRelatedPairs } from "../ai/ai.service.js";
import { nodexFields, toNodex } from "../nodexs/nodexs.routes.js";

export const boardRouter = Router();

boardRouter.get("/", requireAuth, async (req, res) => {
  const userId = req.session.userId!;

  const [groups, rows] = await Promise.all([
    prisma.group.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, description: true },
    }),
    prisma.nodex.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: nodexFields,
    }),
  ]);

  const nodexs = rows.map(toNodex);

  res.json({
    groups: groups.map((group) => ({
      ...group,
      nodexIds: nodexs.filter((n) => n.groupIds.includes(group.id)).map((n) => n.id),
    })),
    nodexs,
    orphanIds: nodexs.filter((n) => n.groupIds.length === 0).map((n) => n.id),
  });
});

boardRouter.get("/related", requireAuth, async (req, res) => {
  res.json({ pairs: await findRelatedPairs(req.session.userId!, 3) });
});
