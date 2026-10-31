import type { RequestHandler } from "express";
import { HttpError } from "../lib/http-error.js";
import { prisma } from "../lib/prisma.js";

export const requireRealUser: RequestHandler = async (req, _res, next) => {
  const user = await prisma.user.findUnique({ where: { id: req.session.userId! }, select: { demoExpiresAt: true } });
  if (user?.demoExpiresAt) {
    throw new HttpError(403, "No disponible en la demo. Crea tu cuenta para usarlo");
  }
  next();
};
