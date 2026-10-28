import { Router, type RequestHandler } from "express";
import multer from "multer";
import { z } from "zod";
import { HttpError } from "../../lib/http-error.js";
import { prisma } from "../../lib/prisma.js";
import { deleteAvatar, storageEnabled, uploadAvatar } from "../../lib/storage.js";
import { requireAuth } from "../../middleware/require-auth.js";
import { publicUser } from "../auth/auth.routes.js";
import { registerSchema } from "../auth/auth.schemas.js";
import { PROVIDERS } from "../auth/oauth.routes.js";

export const meRouter = Router();

meRouter.use(requireAuth);

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => cb(null, IMAGE_TYPES.includes(file.mimetype)),
});

const updateProfileSchema = z.object({ name: registerSchema.shape.name });

const tutorialSchema = z.object({
  version: z.number().int().min(1).max(1000),
});

const requireStorage: RequestHandler = (_req, _res, next) => {
  if (!storageEnabled) {
    throw new HttpError(503, "La subida de imágenes no está configurada");
  }
  next();
};

function updateUser(id: string, data: { name?: string; avatarUrl?: string | null }) {
  return prisma.user.update({ where: { id }, data, select: publicUser });
}

meRouter.get("/", async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: req.session.userId! },
    select: { ...publicUser, passwordHash: true, oauthAccounts: { select: { provider: true } } },
  });

  const { oauthAccounts, passwordHash, ...profile } = user;
  res.json({ user: { ...profile, hasPassword: passwordHash !== null, providers: oauthAccounts.map((a) => a.provider) } });
});

meRouter.patch("/", async (req, res) => {
  const { name } = updateProfileSchema.parse(req.body);
  const user = await updateUser(req.session.userId!, { name });
  res.json({ user });
});

meRouter.put("/avatar", requireStorage, upload.single("avatar"), async (req, res) => {
  if (!req.file) {
    throw new HttpError(400, "Sube una imagen JPG, PNG, WebP o GIF en el campo avatar");
  }

  const userId = req.session.userId!;
  let avatarUrl: string;
  try {
    avatarUrl = await uploadAvatar(userId, req.file.buffer);
  } catch (err) {
    console.error("Error al subir la foto a Cloudinary:", err);
    throw new HttpError(502, "No se ha podido subir la imagen, inténtalo de nuevo más tarde");
  }

  const user = await updateUser(userId, { avatarUrl });
  res.json({ user });
});

meRouter.delete("/avatar", async (req, res) => {
  const userId = req.session.userId!;

  if (storageEnabled) {
    await deleteAvatar(userId).catch((err) => console.error("Error al borrar la foto de Cloudinary:", err));
  }

  const user = await updateUser(userId, { avatarUrl: null });
  res.json({ user });
});

meRouter.delete("/providers/:provider", async (req, res) => {
  const parsed = z.enum(PROVIDERS).safeParse(req.params.provider);
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: req.session.userId! },
    select: { passwordHash: true, oauthAccounts: { select: { provider: true } } },
  });

  if (!parsed.success || !user.oauthAccounts.some((a) => a.provider === parsed.data)) {
    throw new HttpError(404, "Esa cuenta no está vinculada");
  }
  if (!user.passwordHash && user.oauthAccounts.length === 1) {
    throw new HttpError(409, "No puedes desvincular tu único método de inicio de sesión");
  }

  await prisma.oAuthAccount.deleteMany({ where: { userId: req.session.userId!, provider: parsed.data } });
  res.status(204).end();
});

meRouter.put("/tutorial", async (req, res) => {
  const { version } = tutorialSchema.parse(req.body);

  const user = await prisma.user.update({
    where: { id: req.session.userId! },
    data: { tutorialCompletedVersion: version },
    select: { tutorialCompletedVersion: true },
  });

  res.json(user);
});
