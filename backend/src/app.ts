import express from "express";
import helmet from "helmet";
import { errorHandler, notFound } from "./middleware/error-handler.js";
import { healthRouter } from "./modules/health/health.routes.js";

export const app = express();

app.use(helmet());
app.use(express.json({ limit: "100kb" }));

// Todas las rutas cuelgan de /api: el frontend (Next.js) reenviará ahí las
// peticiones, así el navegador solo ve un dominio
app.use("/api/health", healthRouter);

app.use(notFound);
app.use(errorHandler);
