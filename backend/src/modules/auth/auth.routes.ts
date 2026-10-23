import argon2 from "argon2";
import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { isUniqueViolation } from "../../lib/db-errors.js";
import { HttpError } from "../../lib/http-error.js";
import { prisma } from "../../lib/prisma.js";
import { SESSION_COOKIE, startSession } from "../../lib/session.js";
import { requireAuth } from "../../middleware/require-auth.js";
import { loginSchema, registerSchema } from "./auth.schemas.js";

export const authRouter = Router();

export const publicUser = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
  tutorialCompletedVersion: true,
} as const;

const dummyHash = await argon2.hash("nodex-dummy-password");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Demasiados intentos, prueba de nuevo en unos minutos" },
});

authRouter.post("/register", authLimiter, async (req, res) => {
  const { name, email, password } = registerSchema.parse(req.body);
  const passwordHash = await argon2.hash(password);

  try {
    const user = await prisma.user.create({
      data: { name, email, passwordHash },
      select: publicUser,
    });
    await startSession(req, user.id);
    res.status(201).json({ user });
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new HttpError(409, "Ya existe una cuenta con ese email");
    }
    throw err;
  }
});

authRouter.post("/login", authLimiter, async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const found = await prisma.user.findUnique({
    where: { email },
    select: { ...publicUser, passwordHash: true },
  });

  const valid = await argon2.verify(found?.passwordHash ?? dummyHash, password);
  if (!found?.passwordHash || !valid) {
    throw new HttpError(401, "Email o contraseña incorrectos");
  }

  const { passwordHash, ...user } = found;
  await startSession(req, user.id);
  res.json({ user });
});

authRouter.post("/logout", (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie(SESSION_COOKIE);
    res.status(204).end();
  });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.session.userId },
    select: publicUser,
  });

  if (!user) {
    req.session.destroy(() => {});
    throw new HttpError(401, "Debes iniciar sesión");
  }

  res.json({ user });
});
