import { embed, toVector } from "../../lib/embeddings.js";
import { prisma } from "../../lib/prisma.js";

export const MIN_SIMILARITY = 0.35;
export const MIN_MARGIN = 0.1;

function nodexText(nodex: { title: string; content: string | null; url: string | null }) {
  const parts = [nodex.title, nodex.content?.slice(0, 2000)];
  if (nodex.url) {
    const { hostname, pathname, searchParams } = new URL(nodex.url);
    const words = [pathname, ...searchParams.values()].join(" ").replace(/[/_.=+-]+/g, " ");
    parts.push(hostname.replace(/^www\./, ""), words);
  }
  return parts.filter(Boolean).join(". ");
}

export async function updateEmbedding(nodexId: string) {
  const nodex = await prisma.nodex.findUnique({
    where: { id: nodexId },
    select: { title: true, content: true, url: true },
  });
  if (!nodex) return;

  const vector = toVector(await embed(nodexText(nodex)));
  await prisma.$executeRaw`UPDATE nodexs SET embedding = ${vector}::vector WHERE id = ${nodexId}::uuid`;
}

export async function suggestGroup(userId: string, nodexId: string) {
  const [best, second] = await prisma.$queryRaw<{ group_id: string; similarity: number }[]>`
    WITH centroids AS (
      SELECT gn.group_id, AVG(n.embedding) AS centroid
      FROM group_nodexs gn
      JOIN nodexs n ON n.id = gn.nodex_id
      JOIN groups g ON g.id = gn.group_id
      WHERE gn.user_id = ${userId}::uuid
        AND g.deleted_at IS NULL
        AND n.deleted_at IS NULL
        AND n.embedding IS NOT NULL
      GROUP BY gn.group_id
    )
    SELECT c.group_id, (1 - (c.centroid <=> t.embedding))::float AS similarity
    FROM centroids c, nodexs t
    WHERE t.id = ${nodexId}::uuid
      AND t.user_id = ${userId}::uuid
      AND t.deleted_at IS NULL
      AND t.embedding IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM group_nodexs own
        JOIN groups og ON og.id = own.group_id
        WHERE own.nodex_id = t.id AND og.deleted_at IS NULL
      )
      AND NOT EXISTS (
        SELECT 1 FROM ai_suggestions s
        WHERE s.nodex_id = t.id AND s.group_id = c.group_id AND s.status = 'rejected'
      )
    ORDER BY similarity DESC
    LIMIT 2
  `;

  const margin = best ? best.similarity - (second?.similarity ?? 0) : 0;
  if (!best || best.similarity < MIN_SIMILARITY || margin < MIN_MARGIN) return null;

  const pending = await prisma.aiSuggestion.findFirst({
    where: { nodexId, kind: "assign_group", status: "pending" },
  });
  if (pending) {
    return prisma.aiSuggestion.update({ where: { id: pending.id }, data: { groupId: best.group_id } });
  }

  return prisma.aiSuggestion.create({
    data: { userId, nodexId, kind: "assign_group", groupId: best.group_id },
  });
}

export async function processNodex(userId: string, nodexId: string) {
  await updateEmbedding(nodexId);
  await suggestGroup(userId, nodexId);
}

export function processInBackground(userId: string, nodexId: string) {
  processNodex(userId, nodexId).catch((err) => console.error(`Error de IA con el Nodex ${nodexId}:`, err));
}
