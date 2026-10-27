import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middleware/require-auth.js";

export const tagsRouter = Router();

tagsRouter.use(requireAuth);

tagsRouter.get("/", async (req, res) => {
  const rows = await prisma.nodexTag.groupBy({
    by: ["name"],
    where: { userId: req.session.userId!, nodex: { deletedAt: null } },
    _count: { _all: true },
    orderBy: { name: "asc" },
  });
  res.json({ tags: rows.map(({ name, _count }) => ({ name, nodexCount: _count._all })) });
});
