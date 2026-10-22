import { Router } from "express";
import { isUniqueViolation } from "../../lib/db-errors.js";
import { HttpError } from "../../lib/http-error.js";
import { parseId } from "../../lib/params.js";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middleware/require-auth.js";
import { addNodexSchema, createGroupSchema, updateGroupSchema } from "./groups.schemas.js";

export const groupsRouter = Router();

groupsRouter.use(requireAuth);

const GROUP_NOT_FOUND = "Grupo no encontrado";
const DUPLICATE_NAME = "Ya tienes un grupo con ese nombre";

const groupFields = { id: true, name: true, description: true, createdAt: true, updatedAt: true } as const;

async function findGroup(userId: string, id: string) {
  const group = await prisma.group.findFirst({ where: { id, userId, deletedAt: null }, select: groupFields });
  if (!group) {
    throw new HttpError(404, GROUP_NOT_FOUND);
  }
  return group;
}

groupsRouter.get("/", async (req, res) => {
  const groups = await prisma.group.findMany({
    where: { userId: req.session.userId!, deletedAt: null },
    orderBy: { createdAt: "asc" },
    select: {
      ...groupFields,
      _count: { select: { nodexs: { where: { nodex: { deletedAt: null } } } } },
    },
  });

  res.json({
    groups: groups.map(({ _count, ...group }) => ({ ...group, nodexCount: _count.nodexs })),
  });
});

groupsRouter.post("/", async (req, res) => {
  const data = createGroupSchema.parse(req.body);

  try {
    const group = await prisma.group.create({
      data: { ...data, userId: req.session.userId! },
      select: groupFields,
    });
    res.status(201).json({ group });
  } catch (err) {
    if (isUniqueViolation(err)) throw new HttpError(409, DUPLICATE_NAME);
    throw err;
  }
});

groupsRouter.patch("/:id", async (req, res) => {
  const id = parseId(req.params.id, GROUP_NOT_FOUND);
  const data = updateGroupSchema.parse(req.body);
  await findGroup(req.session.userId!, id);

  try {
    const group = await prisma.group.update({ where: { id }, data, select: groupFields });
    res.json({ group });
  } catch (err) {
    if (isUniqueViolation(err)) throw new HttpError(409, DUPLICATE_NAME);
    throw err;
  }
});

groupsRouter.delete("/:id", async (req, res) => {
  const id = parseId(req.params.id, GROUP_NOT_FOUND);
  const { count } = await prisma.group.updateMany({
    where: { id, userId: req.session.userId!, deletedAt: null },
    data: { deletedAt: new Date() },
  });

  if (count === 0) {
    throw new HttpError(404, GROUP_NOT_FOUND);
  }
  res.status(204).end();
});

groupsRouter.post("/:id/nodexs", async (req, res) => {
  const userId = req.session.userId!;
  const groupId = parseId(req.params.id, GROUP_NOT_FOUND);
  const { nodexId } = addNodexSchema.parse(req.body);

  await findGroup(userId, groupId);
  const nodex = await prisma.nodex.findFirst({ where: { id: nodexId, userId, deletedAt: null } });
  if (!nodex) {
    throw new HttpError(404, "Nodex no encontrado");
  }

  await prisma.groupNodex.createMany({
    data: [{ groupId, nodexId, userId }],
    skipDuplicates: true,
  });
  res.status(204).end();
});

groupsRouter.delete("/:id/nodexs/:nodexId", async (req, res) => {
  const groupId = parseId(req.params.id, GROUP_NOT_FOUND);
  const nodexId = parseId(req.params.nodexId, "Nodex no encontrado");

  const { count } = await prisma.groupNodex.deleteMany({
    where: { groupId, nodexId, userId: req.session.userId! },
  });

  if (count === 0) {
    throw new HttpError(404, "Ese Nodex no está en el grupo");
  }
  res.status(204).end();
});
