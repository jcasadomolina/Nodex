import argon2 from "argon2";
import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { isUniqueViolation } from "../../lib/db-errors.js";
import { HttpError } from "../../lib/http-error.js";
import { prisma } from "../../lib/prisma.js";
import { startSession } from "../../lib/session.js";
import { requireAuth } from "../../middleware/require-auth.js";
import { publicUser } from "../auth/auth.routes.js";
import { registerSchema } from "../auth/auth.schemas.js";
import { createDemoUser, prepareDemoAi } from "./demo.service.js";

export const demoRouter = Router();

const demoLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Has creado demasiadas demos. Prueba dentro de un rato" },
});

demoRouter.post("/demo", demoLimiter, async (req, res) => {
  const { userId, nodexIds, linkIds } = await createDemoUser();
  await prepareDemoAi(userId, nodexIds, linkIds);
  await startSession(req, userId);

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: publicUser });
  res.status(201).json({ user });
});

demoRouter.post("/demo/convert", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const current = await prisma.user.findUnique({ where: { id: userId }, select: { demoExpiresAt: true } });
  if (!current?.demoExpiresAt) {
    throw new HttpError(403, "Solo se puede convertir una cuenta demo");
  }

  const { name, email, password } = registerSchema.parse(req.body);
  const passwordHash = await argon2.hash(password);

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { name, email, passwordHash, demoExpiresAt: null },
      select: publicUser,
    });
    await startSession(req, user.id);
    res.json({ user });
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new HttpError(409, "Ya existe una cuenta con ese email");
    }
    throw err;
  }
});
