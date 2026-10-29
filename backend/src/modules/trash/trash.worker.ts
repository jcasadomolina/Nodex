import { prisma } from "../../lib/prisma.js";

export const TRASH_DAYS = 30;
const INTERVAL_MS = 60 * 60 * 1000;

export async function purgeTrash() {
  const before = new Date(Date.now() - TRASH_DAYS * 24 * 60 * 60 * 1000);
  const [nodexs, groups] = await prisma.$transaction([
    prisma.nodex.deleteMany({ where: { deletedAt: { lt: before } } }),
    prisma.group.deleteMany({ where: { deletedAt: { lt: before } } }),
  ]);
  return { nodexs: nodexs.count, groups: groups.count };
}

async function tick() {
  try {
    await purgeTrash();
  } catch (err) {
    console.error("Error al vaciar la papelera antigua:", err);
  }
}

export function startTrashWorker() {
  setInterval(tick, INTERVAL_MS).unref();
  void tick();
}
