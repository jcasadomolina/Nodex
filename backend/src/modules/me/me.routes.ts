import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middleware/require-auth.js";

export const meRouter = Router();

meRouter.use(requireAuth);

const tutorialSchema = z.object({
  version: z.number().int().min(1).max(1000),
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
