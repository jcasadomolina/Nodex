import { Router, type RequestHandler } from "express";
import { z } from "zod";
import { env } from "../../config/env.js";
import { HttpError } from "../../lib/http-error.js";
import { prisma } from "../../lib/prisma.js";
import { pushEnabled } from "../../lib/push.js";
import { requireAuth } from "../../middleware/require-auth.js";

export const pushRouter = Router();

pushRouter.use(requireAuth);

const requirePush: RequestHandler = (_req, _res, next) => {
  if (!pushEnabled) {
    throw new HttpError(503, "Las notificaciones push no están configuradas");
  }
  next();
};

const subscriptionSchema = z.object({
  endpoint: z.url({ protocol: /^https$/ }),
  keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }),
});

const endpointSchema = z.object({ endpoint: z.string().min(1) });

pushRouter.get("/public-key", requirePush, (_req, res) => {
  res.json({ publicKey: env.VAPID_PUBLIC_KEY });
});

pushRouter.post("/subscriptions", requirePush, async (req, res) => {
  const { endpoint, keys } = subscriptionSchema.parse(req.body);
  const data = { userId: req.session.userId!, p256dh: keys.p256dh, auth: keys.auth };

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { endpoint, ...data },
    update: data,
  });
  res.status(204).end();
});

pushRouter.delete("/subscriptions", async (req, res) => {
  const { endpoint } = endpointSchema.parse(req.body);
  await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: req.session.userId! } });
  res.status(204).end();
});
