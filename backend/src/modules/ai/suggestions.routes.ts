import { Router } from "express";
import { z } from "zod";
import { isUniqueViolation } from "../../lib/db-errors.js";
import { HttpError } from "../../lib/http-error.js";
import { parseId } from "../../lib/params.js";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middleware/require-auth.js";
import { createGroupSchema } from "../groups/groups.schemas.js";
import { lockNewGroups, proposeNewGroups, suggestGroup } from "./ai.service.js";

export const suggestionsRouter = Router();

suggestionsRouter.use(requireAuth);

const SUGGESTION_NOT_FOUND = "Sugerencia no encontrada";
const PROPOSAL_NOT_FOUND = "Propuesta de grupo no encontrada";

const proposalSchema = z.object({ name: z.string().trim().min(1).max(80) });
const acceptProposalSchema = proposalSchema.extend({ groupName: createGroupSchema.shape.name });

const activeOrphan = {
  deletedAt: null,
  groups: { none: { group: { deletedAt: null } } },
};

const unassignedOrphan = {
  ...activeOrphan,
  aiSuggestions: { none: { kind: "assign_group", status: "pending", group: { deletedAt: null } } },
};

async function findPending(userId: string, id: string) {
  const suggestion = await prisma.aiSuggestion.findFirst({
    where: { id, userId, status: "pending", nodex: activeOrphan, group: { deletedAt: null } },
  });
  if (!suggestion) {
    throw new HttpError(404, SUGGESTION_NOT_FOUND);
  }
  return suggestion;
}

suggestionsRouter.get("/", async (req, res) => {
  const suggestions = await prisma.aiSuggestion.findMany({
    where: { userId: req.session.userId!, kind: "assign_group", status: "pending", nodex: activeOrphan, group: { deletedAt: null } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      kind: true,
      createdAt: true,
      nodex: { select: { id: true, title: true, type: true } },
      group: { select: { id: true, name: true } },
    },
  });
  const proposals = await prisma.aiSuggestion.findMany({
    where: { userId: req.session.userId!, kind: "new_group", status: "pending", nodex: unassignedOrphan },
    orderBy: { createdAt: "asc" },
    select: { suggestedName: true, nodex: { select: { id: true, title: true, type: true } } },
  });
  const byName = new Map<string, (typeof proposals)[number]["nodex"][]>();
  for (const { suggestedName, nodex } of proposals) {
    byName.set(suggestedName!, [...(byName.get(suggestedName!) ?? []), nodex]);
  }
  const newGroups = [...byName].map(([name, nodexs]) => ({ name, nodexs })).filter((g) => g.nodexs.length >= 2);

  res.json({ suggestions, newGroups });
});

suggestionsRouter.post("/refresh", async (req, res) => {
  const userId = req.session.userId!;
  const orphans = await prisma.nodex.findMany({
    where: { userId, ...activeOrphan },
    select: { id: true },
  });
  for (const { id } of orphans) {
    await suggestGroup(userId, id);
  }

  const pending = await prisma.aiSuggestion.count({
    where: { userId, kind: "assign_group", status: "pending", nodex: activeOrphan, group: { deletedAt: null } },
  });
  const newGroups = await proposeNewGroups(userId);
  res.json({ reviewed: orphans.length, pending, newGroups });
});

suggestionsRouter.post("/new-groups/accept", async (req, res) => {
  const userId = req.session.userId!;
  const { name, groupName } = acceptProposalSchema.parse(req.body);
  const where = { userId, kind: "new_group", status: "pending", suggestedName: name };

  try {
    const group = await prisma.$transaction(async (tx) => {
      await lockNewGroups(tx, userId);
      const rows = await tx.aiSuggestion.findMany({ where, select: { nodexId: true } });
      if (rows.length === 0) {
        throw new HttpError(404, PROPOSAL_NOT_FOUND);
      }
      const orphans = await tx.nodex.findMany({
        where: { id: { in: rows.map((r) => r.nodexId) }, userId, ...unassignedOrphan },
        select: { id: true },
      });
      if (orphans.length === 0) {
        throw new HttpError(409, "Los Nodexs de esta propuesta ya no son huérfanos");
      }
      const created = await tx.group.create({ data: { userId, name: groupName }, select: { id: true, name: true } });
      await tx.groupNodex.createMany({
        data: orphans.map(({ id }) => ({ groupId: created.id, nodexId: id, userId, addedBy: "ai" })),
      });
      await tx.aiSuggestion.updateMany({ where, data: { status: "accepted", resolvedAt: new Date() } });
      return created;
    });
    res.status(201).json({ group });
  } catch (err) {
    if (isUniqueViolation(err)) throw new HttpError(409, "Ya tienes un grupo con ese nombre");
    throw err;
  }
});

suggestionsRouter.post("/new-groups/reject", async (req, res) => {
  const { name } = proposalSchema.parse(req.body);
  const { count } = await prisma.aiSuggestion.updateMany({
    where: { userId: req.session.userId!, kind: "new_group", status: "pending", suggestedName: name },
    data: { status: "rejected", resolvedAt: new Date() },
  });
  if (count === 0) {
    throw new HttpError(404, PROPOSAL_NOT_FOUND);
  }
  res.status(204).end();
});

suggestionsRouter.post("/:id/accept", async (req, res) => {
  const userId = req.session.userId!;
  const suggestion = await findPending(userId, parseId(req.params.id, SUGGESTION_NOT_FOUND));

  await prisma.$transaction([
    prisma.groupNodex.createMany({
      data: [{ groupId: suggestion.groupId!, nodexId: suggestion.nodexId, userId, addedBy: "ai" }],
      skipDuplicates: true,
    }),
    prisma.aiSuggestion.update({
      where: { id: suggestion.id },
      data: { status: "accepted", resolvedAt: new Date() },
    }),
  ]);
  res.status(204).end();
});

suggestionsRouter.post("/:id/reject", async (req, res) => {
  const userId = req.session.userId!;
  const suggestion = await findPending(userId, parseId(req.params.id, SUGGESTION_NOT_FOUND));

  await prisma.aiSuggestion.update({
    where: { id: suggestion.id },
    data: { status: "rejected", resolvedAt: new Date() },
  });
  suggestGroup(userId, suggestion.nodexId).catch((err) => console.error(`Error de IA con el Nodex ${suggestion.nodexId}:`, err));
  res.status(204).end();
});
