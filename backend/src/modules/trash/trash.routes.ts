import { Router } from "express";
import { isUniqueViolation } from "../../lib/db-errors.js";
import { HttpError } from "../../lib/http-error.js";
import { parseId } from "../../lib/params.js";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middleware/require-auth.js";
import { restoredName } from "./trash.names.js";

export const trashRouter = Router();

trashRouter.use(requireAuth);

const NOT_IN_TRASH = "No está en la papelera";

const inTrash = { deletedAt: { not: null } };

trashRouter.get("/", async (req, res) => {
  const userId = req.session.userId!;
  const [nodexs, groups] = await Promise.all([
    prisma.nodex.findMany({
      where: { userId, ...inTrash },
      orderBy: { deletedAt: "desc" },
      select: { id: true, title: true, type: true, deletedAt: true },
    }),
    prisma.group.findMany({
      where: { userId, ...inTrash },
      orderBy: { deletedAt: "desc" },
      select: {
        id: true,
        name: true,
        deletedAt: true,
        _count: { select: { nodexs: { where: { nodex: { deletedAt: null } } } } },
      },
    }),
  ]);
  res.json({
    nodexs,
    groups: groups.map(({ _count, ...group }) => ({ ...group, nodexCount: _count.nodexs })),
  });
});

trashRouter.post("/nodexs/:id/restore", async (req, res) => {
  const id = parseId(req.params.id, NOT_IN_TRASH);
  const { count } = await prisma.nodex.updateMany({
    where: { id, userId: req.session.userId!, ...inTrash },
    data: { deletedAt: null },
  });
  if (count === 0) throw new HttpError(404, NOT_IN_TRASH);
  res.status(204).end();
});

trashRouter.post("/groups/:id/restore", async (req, res) => {
  const userId = req.session.userId!;
  const id = parseId(req.params.id, NOT_IN_TRASH);
  const group = await prisma.group.findFirst({ where: { id, userId, ...inTrash }, select: { name: true } });
  if (!group) throw new HttpError(404, NOT_IN_TRASH);

  const active = await prisma.group.findMany({ where: { userId, deletedAt: null }, select: { name: true } });
  const taken = new Set(active.map((g) => g.name));
  let attempt = 0;
  while (taken.has(restoredName(group.name, attempt))) attempt++;

  const name = restoredName(group.name, attempt);
  try {
    const { count } = await prisma.group.updateMany({ where: { id, userId, ...inTrash }, data: { deletedAt: null, name } });
    if (count === 0) throw new HttpError(404, NOT_IN_TRASH);
    res.json({ group: { id, name } });
  } catch (err) {
    if (isUniqueViolation(err)) throw new HttpError(409, "Ya tienes un grupo con ese nombre, inténtalo de nuevo");
    throw err;
  }
});

trashRouter.delete("/nodexs/:id", async (req, res) => {
  const id = parseId(req.params.id, NOT_IN_TRASH);
  const { count } = await prisma.nodex.deleteMany({ where: { id, userId: req.session.userId!, ...inTrash } });
  if (count === 0) throw new HttpError(404, NOT_IN_TRASH);
  res.status(204).end();
});

trashRouter.delete("/groups/:id", async (req, res) => {
  const id = parseId(req.params.id, NOT_IN_TRASH);
  const { count } = await prisma.group.deleteMany({ where: { id, userId: req.session.userId!, ...inTrash } });
  if (count === 0) throw new HttpError(404, NOT_IN_TRASH);
  res.status(204).end();
});

trashRouter.delete("/", async (req, res) => {
  const userId = req.session.userId!;
  const [nodexs, groups] = await prisma.$transaction([
    prisma.nodex.deleteMany({ where: { userId, ...inTrash } }),
    prisma.group.deleteMany({ where: { userId, ...inTrash } }),
  ]);
  res.json({ nodexs: nodexs.count, groups: groups.count });
});
