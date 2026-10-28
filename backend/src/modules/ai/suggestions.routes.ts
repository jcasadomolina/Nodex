import { Router } from "express";
import { HttpError } from "../../lib/http-error.js";
import { parseId } from "../../lib/params.js";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middleware/require-auth.js";
import { suggestGroup, updateEmbedding } from "./ai.service.js";

export const suggestionsRouter = Router();

suggestionsRouter.use(requireAuth);

const SUGGESTION_NOT_FOUND = "Sugerencia no encontrada";

const activeOrphan = {
  deletedAt: null,
  groups: { none: { group: { deletedAt: null } } },
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
    where: { userId: req.session.userId!, status: "pending", nodex: activeOrphan, group: { deletedAt: null } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      kind: true,
      createdAt: true,
      nodex: { select: { id: true, title: true, type: true } },
      group: { select: { id: true, name: true } },
    },
  });
  res.json({ suggestions });
});

suggestionsRouter.post("/refresh", async (req, res) => {
  const userId = req.session.userId!;
  const withoutEmbedding = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM nodexs WHERE user_id = ${userId}::uuid AND deleted_at IS NULL AND embedding IS NULL
  `;
  for (const { id } of withoutEmbedding) {
    await updateEmbedding(id);
  }

  const orphans = await prisma.nodex.findMany({
    where: { userId, ...activeOrphan },
    select: { id: true },
  });
  for (const { id } of orphans) {
    await suggestGroup(userId, id);
  }

  const pending = await prisma.aiSuggestion.count({
    where: { userId, status: "pending", nodex: activeOrphan, group: { deletedAt: null } },
  });
  res.json({ reviewed: orphans.length, pending });
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
