import { parsePreview } from "../../lib/html-meta.js";
import { prisma } from "../../lib/prisma.js";
import { BlockedUrlError, safeFetch } from "../../lib/safe-fetch.js";

export const previewFields = {
  status: true,
  title: true,
  description: true,
  imageUrl: true,
  siteName: true,
  archiveUrl: true,
  lastCheckedAt: true,
} as const;

async function findArchive(url: string) {
  try {
    const res = await fetch(`https://archive.org/wayback/available?url=${encodeURIComponent(url)}`, {
      signal: AbortSignal.timeout(15_000),
    });
    const data = (await res.json()) as { archived_snapshots?: { closest?: { available?: boolean; url?: string } } };
    const closest = data.archived_snapshots?.closest;
    return closest?.available && closest.url ? closest.url.replace(/^http:/, "https:") : null;
  } catch {
    return null;
  }
}

async function checkUrl(url: string) {
  try {
    const page = await safeFetch(url);
    if (page.status === 404 || page.status === 410) {
      return { status: "broken", httpStatus: page.status };
    }
    if (page.status >= 200 && page.status < 300) {
      return { status: "ok", httpStatus: page.status, ...(page.body && parsePreview(page.body, page.finalUrl)) };
    }
    return { status: "unreachable", httpStatus: page.status };
  } catch (err) {
    if (err instanceof BlockedUrlError) return { status: "blocked", httpStatus: null };
    return { status: "unreachable", httpStatus: null };
  }
}

export async function refreshPreview(nodexId: string) {
  const nodex = await prisma.nodex.findUnique({
    where: { id: nodexId },
    select: { userId: true, url: true, deletedAt: true },
  });

  if (!nodex || nodex.deletedAt || !nodex.url) {
    await prisma.linkPreview.deleteMany({ where: { nodexId } });
    return null;
  }

  const previous = await prisma.linkPreview.findUnique({ where: { nodexId }, select: { url: true, archiveUrl: true } });
  const urlChanged = previous?.url !== nodex.url;
  const knownArchive = urlChanged ? null : previous?.archiveUrl;

  const result = await checkUrl(nodex.url);
  const needsArchive = result.status === "broken" || result.status === "unreachable";
  const archiveUrl = needsArchive ? (knownArchive ?? (await findArchive(nodex.url))) : null;
  const data = {
    ...(urlChanged && { title: null, description: null, imageUrl: null, siteName: null }),
    ...result,
    url: nodex.url,
    archiveUrl,
    lastCheckedAt: new Date(),
  };

  return prisma.linkPreview.upsert({
    where: { nodexId },
    create: { nodexId, userId: nodex.userId, ...data },
    update: data,
    select: previewFields,
  });
}

export function refreshPreviewInBackground(nodexId: string) {
  refreshPreview(nodexId).catch((err) => console.error(`Error al revisar el enlace del Nodex ${nodexId}:`, err));
}
