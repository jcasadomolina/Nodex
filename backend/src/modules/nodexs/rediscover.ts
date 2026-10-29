import { prisma } from "../../lib/prisma.js";
import { priorityToNumber } from "./nodexs.schemas.js";

export const FORGOTTEN_DAYS = 30;
export const RECENT_DAYS = 7;
export const REDISCOVER_COUNT = 3;
export const RANDOM_WEIGHT = 0.5;

export function findForgotten(userId: string) {
  return prisma.$queryRaw<{ id: string }[]>`
    WITH recent AS (
      SELECT embedding FROM nodexs
      WHERE user_id = ${userId}::uuid
        AND deleted_at IS NULL
        AND embedding IS NOT NULL
        AND last_opened_at >= now() - make_interval(days => ${RECENT_DAYS}::int)
    )
    SELECT n.id FROM nodexs n
    WHERE n.user_id = ${userId}::uuid
      AND n.deleted_at IS NULL
      AND COALESCE(n.last_opened_at, n.created_at) <= now() - make_interval(days => ${FORGOTTEN_DAYS}::int)
      AND (n.priority IS NULL OR n.priority < ${priorityToNumber("high")})
    ORDER BY
      COALESCE((SELECT MAX(1 - (n.embedding <=> r.embedding)) FROM recent r), 0)
        + ${RANDOM_WEIGHT}::float * (('x' || substr(md5(n.id::text || (now() AT TIME ZONE 'Europe/Madrid')::date::text), 1, 7))::bit(28)::int / 268435456.0)
        DESC,
      n.id
    LIMIT ${REDISCOVER_COUNT}
  `;
}

export function markOpened(userId: string, id: string) {
  return prisma.$executeRaw`
    UPDATE nodexs SET last_opened_at = now()
    WHERE id = ${id}::uuid AND user_id = ${userId}::uuid AND deleted_at IS NULL
  `;
}
