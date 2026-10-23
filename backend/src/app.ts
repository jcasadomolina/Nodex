import express from "express";
import helmet from "helmet";
import passport from "passport";
import { env } from "./config/env.js";
import { sessionMiddleware } from "./lib/session.js";
import { errorHandler, notFound } from "./middleware/error-handler.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { suggestionsRouter } from "./modules/ai/suggestions.routes.js";
import { oauthRouter } from "./modules/auth/oauth.routes.js";
import { boardRouter } from "./modules/board/board.routes.js";
import { groupsRouter } from "./modules/groups/groups.routes.js";
import { healthRouter } from "./modules/health/health.routes.js";
import { meRouter } from "./modules/me/me.routes.js";
import { nodexsRouter } from "./modules/nodexs/nodexs.routes.js";

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
app.use("/api/me", meRouter);
app.use("/api/groups", groupsRouter);
app.use("/api/nodexs", nodexsRouter);
app.use("/api/board", boardRouter);
app.use("/api/suggestions", suggestionsRouter);

app.use(notFound);
app.use(errorHandler);
