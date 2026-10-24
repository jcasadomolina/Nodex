import { prisma } from "../../lib/prisma.js";
import { refreshPreview } from "./links.service.js";

const INTERVAL_MS = 10 * 60 * 1000;
const RECHECK_AFTER_DAYS = 7;
const BATCH_SIZE = 20;

export async function checkStaleLinks() {
  const staleBefore = new Date(Date.now() - RECHECK_AFTER_DAYS * 24 * 60 * 60 * 1000);
  const stale = await prisma.linkPreview.findMany({
    where: {
      nodex: { deletedAt: null },
      OR: [{ lastCheckedAt: null }, { lastCheckedAt: { lt: staleBefore } }],
    },
    orderBy: { lastCheckedAt: { sort: "asc", nulls: "first" } },
    take: BATCH_SIZE,
    select: { nodexId: true },
  });

  for (const { nodexId } of stale) {
    await refreshPreview(nodexId).catch((err) => console.error(`Error al revisar el enlace del Nodex ${nodexId}:`, err));
  }
  return stale.length;
}

let running = false;

async function tick() {
  if (running) return;
  running = true;
  try {
    await checkStaleLinks();
  } catch (err) {
    console.error("Error al revisar los enlaces:", err);
  } finally {
    running = false;
  }
}

export function startLinkWorker() {
  setInterval(tick, INTERVAL_MS).unref();
}
