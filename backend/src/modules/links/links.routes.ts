import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { HttpError } from "../../lib/http-error.js";
import { parseId } from "../../lib/params.js";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middleware/require-auth.js";
import { previewFields, refreshPreview } from "./links.service.js";

export const linksRouter = Router();

linksRouter.use(requireAuth);

const NODEX_NOT_FOUND = "Nodex no encontrado";

export const refreshLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Demasiadas comprobaciones, espera un minuto" },
});

linksRouter.get("/broken", async (req, res) => {
  const links = await prisma.linkPreview.findMany({
    where: { userId: req.session.userId!, status: "broken", nodex: { deletedAt: null } },
    orderBy: { lastCheckedAt: "desc" },
    select: { ...previewFields, url: true, nodex: { select: { id: true, title: true } } },
  });
  res.json({ links });
});

linksRouter.post("/:nodexId/refresh", refreshLimiter, async (req, res) => {
  const nodexId = parseId(String(req.params.nodexId), NODEX_NOT_FOUND);
  const nodex = await prisma.nodex.findFirst({
    where: { id: nodexId, userId: req.session.userId!, deletedAt: null, url: { not: null } },
  });
  if (!nodex) {
    throw new HttpError(404, NODEX_NOT_FOUND);
  }

  const preview = await refreshPreview(nodexId);
  res.json({ preview });
});
