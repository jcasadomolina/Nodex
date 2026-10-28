import { setTimeout as wait } from "node:timers/promises";
import { embed, toVector } from "../../lib/embeddings.js";
import type { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { boostPairs, clusterByNeighbors, MIN_NEW_GROUP_SIZE, MIN_PAIR_SIMILARITY, suggestName, type Pair } from "./new-groups.js";

export const MIN_SIMILARITY = 0.35;
export const MIN_MARGIN = 0.1;
export const MIN_SEARCH_SCORE = 0.3;
export const TITLE_MATCH_BONUS = 1;
export const TEXT_MATCH_BONUS = 0.5;
export const MIN_RELATED_SIMILARITY = 0.45;
export const MIN_DUPLICATE_SIMILARITY = 0.9;
const DUPLICATE_TIMEOUT_MS = 3000;

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

type Match = { id: string; similarity: number };

async function findDuplicates(userId: string, nodexId: string) {
  return prisma.$queryRaw<Match[]>`
    SELECT n.id, COALESCE(1 - (n.embedding <=> t.embedding), 1)::float AS similarity
    FROM nodexs n, nodexs t
    WHERE t.id = ${nodexId}::uuid
      AND n.user_id = ${userId}::uuid
      AND n.id <> t.id
      AND n.deleted_at IS NULL
      AND (
        rtrim(n.url, '/') = rtrim(t.url, '/')
        OR 1 - (n.embedding <=> t.embedding) >= ${MIN_DUPLICATE_SIMILARITY}::float
      )
    ORDER BY similarity DESC
    LIMIT 5
  `;
}

export function checkNewNodex(userId: string, nodexId: string) {
  const check = (async () => {
    await updateEmbedding(nodexId);
    const duplicates = await findDuplicates(userId, nodexId);
    await suggestGroup(userId, nodexId);
    return duplicates;
  })().catch((err) => {
    console.error(`Error de IA con el Nodex ${nodexId}:`, err);
    return [];
  });
  return Promise.race([check, wait(DUPLICATE_TIMEOUT_MS, [] as Match[])]);
}

export async function findRelatedPairs(userId: string, perNodex: number) {
  return prisma.$queryRaw<{ a: string; b: string; similarity: number }[]>`
    SELECT DISTINCT LEAST(n.id, m.id) AS a, GREATEST(n.id, m.id) AS b, m.similarity
    FROM nodexs n
    CROSS JOIN LATERAL (
      SELECT o.id, (1 - (o.embedding <=> n.embedding))::float AS similarity
      FROM nodexs o
      WHERE o.user_id = n.user_id
        AND o.id <> n.id
        AND o.deleted_at IS NULL
        AND o.embedding IS NOT NULL
      ORDER BY o.embedding <=> n.embedding
      LIMIT ${perNodex}
    ) m
    WHERE n.user_id = ${userId}::uuid
      AND n.deleted_at IS NULL
      AND n.embedding IS NOT NULL
      AND m.similarity >= ${MIN_RELATED_SIMILARITY}::float
  `;
}

export async function findRelated(userId: string, nodexId: string, limit: number) {
  return prisma.$queryRaw<Match[]>`
    SELECT n.id, (1 - (n.embedding <=> t.embedding))::float AS similarity
    FROM nodexs n, nodexs t
    WHERE t.id = ${nodexId}::uuid
      AND n.user_id = ${userId}::uuid
      AND n.id <> t.id
      AND n.deleted_at IS NULL
      AND 1 - (n.embedding <=> t.embedding) >= ${MIN_RELATED_SIMILARITY}::float
    ORDER BY n.embedding <=> t.embedding
    LIMIT ${limit}
  `;
}

export async function searchNodexs(userId: string, query: string, limit: number) {
  const vector = await embed(query)
    .then(toVector)
    .catch((err) => {
      console.error("Error de IA en la búsqueda; se busca solo por texto:", err);
      return null;
    });
  const pattern = `%${query.replace(/[\\%_]/g, "\\$&")}%`;

  return prisma.$queryRaw<{ id: string; score: number }[]>`
    SELECT id, score FROM (
      SELECT id,
        (
          COALESCE(1 - (embedding <=> ${vector}::vector), 0)
          + CASE
              WHEN title ILIKE ${pattern} THEN ${TITLE_MATCH_BONUS}::float
              WHEN content ILIKE ${pattern} OR url ILIKE ${pattern}
                OR EXISTS (SELECT 1 FROM nodex_tags nt WHERE nt.nodex_id = nodexs.id AND nt.name ILIKE ${pattern})
                THEN ${TEXT_MATCH_BONUS}::float
              ELSE 0
            END
        )::float AS score
      FROM nodexs
      WHERE user_id = ${userId}::uuid AND deleted_at IS NULL
    ) ranked
    WHERE score >= ${MIN_SEARCH_SCORE}::float
    ORDER BY score DESC
    LIMIT ${limit}
  `;
}

export const MAX_NEW_GROUP_CANDIDATES = 500;

export function lockNewGroups(tx: Prisma.TransactionClient, userId: string) {
  return tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`new-groups:${userId}`}))`;
}

export async function proposeNewGroups(userId: string) {
  const candidates = await prisma.$queryRaw<{ id: string }[]>`
    SELECT n.id FROM nodexs n
    WHERE n.user_id = ${userId}::uuid
      AND n.deleted_at IS NULL
      AND n.embedding IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM group_nodexs gn JOIN groups g ON g.id = gn.group_id
        WHERE gn.nodex_id = n.id AND g.deleted_at IS NULL
      )
      AND NOT EXISTS (
        SELECT 1 FROM ai_suggestions s
        WHERE s.nodex_id = n.id
          AND (
            (s.kind = 'assign_group' AND s.status = 'pending'
              AND EXISTS (SELECT 1 FROM groups sg WHERE sg.id = s.group_id AND sg.deleted_at IS NULL))
            OR (s.kind = 'new_group' AND s.status = 'rejected')
          )
      )
    ORDER BY n.created_at DESC, n.id
    LIMIT ${MAX_NEW_GROUP_CANDIDATES}
  `;
  const ids = candidates.map((c) => c.id);

  const pairs = ids.length < MIN_NEW_GROUP_SIZE ? [] : await prisma.$queryRaw<Pair[]>`
    SELECT a.id AS a, b.id AS b, (1 - (a.embedding <=> b.embedding))::float AS similarity
    FROM nodexs a JOIN nodexs b ON a.id < b.id
    WHERE a.id = ANY(${ids}::uuid[])
      AND b.id = ANY(${ids}::uuid[])
      AND 1 - (a.embedding <=> b.embedding) >= ${MIN_PAIR_SIMILARITY}::float
  `;
  const details = await prisma.nodex.findMany({
    where: { id: { in: ids } },
    select: { id: true, title: true, tags: { select: { name: true } } },
  });
  const byId = new Map(details.map((n) => [n.id, { title: n.title, tags: n.tags.map((t) => t.name) }]));
  const clusters = clusterByNeighbors(ids, boostPairs(byId, pairs));
  const groups = await prisma.group.findMany({ where: { userId, deletedAt: null }, select: { name: true } });
  const taken = new Set(groups.map((g) => g.name.toLowerCase()));

  const rows = clusters.flatMap((members) => {
    const name = suggestName(
      members.map((id) => byId.get(id)!),
      taken,
    );
    taken.add(name.toLowerCase());
    return members.map((nodexId) => ({ userId, nodexId, kind: "new_group", suggestedName: name }));
  });
  await prisma.$transaction(async (tx) => {
    await lockNewGroups(tx, userId);
    await tx.aiSuggestion.deleteMany({ where: { userId, kind: "new_group", status: "pending" } });
    await tx.aiSuggestion.createMany({ data: rows });
  });
  return clusters.length;
}
