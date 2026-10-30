import express from "express";
import helmet from "helmet";
import passport from "passport";
import { env } from "./config/env.js";
import { sessionMiddleware } from "./lib/session.js";
import { errorHandler, notFound } from "./middleware/error-handler.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { demoRouter } from "./modules/demo/demo.routes.js";
import { suggestionsRouter } from "./modules/ai/suggestions.routes.js";
import { oauthRouter } from "./modules/auth/oauth.routes.js";
import { boardRouter } from "./modules/board/board.routes.js";
import { groupsRouter } from "./modules/groups/groups.routes.js";
import { healthRouter } from "./modules/health/health.routes.js";
import { linksRouter } from "./modules/links/links.routes.js";
import { meRouter } from "./modules/me/me.routes.js";
import { nodexsRouter } from "./modules/nodexs/nodexs.routes.js";
import { pushRouter } from "./modules/push/push.routes.js";
import { remindersRouter } from "./modules/reminders/reminders.routes.js";
import { tagsRouter } from "./modules/tags/tags.routes.js";
import { tasksRouter } from "./modules/tasks/tasks.routes.js";
import { trashRouter } from "./modules/trash/trash.routes.js";

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
app.use("/api/auth", demoRouter);
app.use("/api/me", meRouter);
app.use("/api/groups", groupsRouter);
app.use("/api/nodexs", nodexsRouter);
app.use("/api/tags", tagsRouter);
app.use("/api/board", boardRouter);
app.use("/api/suggestions", suggestionsRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/reminders", remindersRouter);
app.use("/api/push", pushRouter);
app.use("/api/links", linksRouter);
app.use("/api/trash", trashRouter);

app.use(notFound);
app.use(errorHandler);
