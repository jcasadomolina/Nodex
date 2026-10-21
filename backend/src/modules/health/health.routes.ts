import { Router } from "express";
import { prisma } from "../../lib/prisma.js";

export const healthRouter = Router();

// Comprueba que el servidor responde y que llega a la base de datos.
// Si la base falla, el servidor sigue vivo y lo indica con un 503 (RNF-08.2).
healthRouter.get("/", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", database: "ok" });
  } catch (err) {
    console.error("La base de datos no responde:", err);
    res.status(503).json({ status: "degraded", database: "unreachable" });
  }
});
