import express from "express";
import helmet from "helmet";
import passport from "passport";
import { env } from "./config/env.js";
import { sessionMiddleware } from "./lib/session.js";
import { errorHandler, notFound } from "./middleware/error-handler.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { oauthRouter } from "./modules/auth/oauth.routes.js";
import { healthRouter } from "./modules/health/health.routes.js";

export const app = express();

if (env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(helmet());
app.use(express.json({ limit: "100kb" }));
app.use(sessionMiddleware);
app.use(passport.initialize());

app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/auth", oauthRouter);

app.use(notFound);
app.use(errorHandler);
