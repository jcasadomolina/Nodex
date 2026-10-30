import { prisma } from "../../lib/prisma.js";

const INTERVAL_MS = 60 * 60 * 1000;

export async function purgeDemos(now = new Date()) {
  const [row] = await prisma.$queryRaw<{ count: number }[]>`
    WITH gone AS (
      DELETE FROM users WHERE demo_expires_at < ${now} RETURNING id
    ), sessions_gone AS (
      DELETE FROM sessions WHERE sess->>'userId' IN (SELECT id::text FROM gone)
    )
    SELECT count(*)::int AS count FROM gone
  `;
  return row!.count;
}

async function tick() {
  try {
    await purgeDemos();
  } catch (err) {
    console.error("Error al borrar las demos caducadas:", err);
  }
}

export function startDemoWorker() {
  setInterval(tick, INTERVAL_MS).unref();
  void tick();
}
