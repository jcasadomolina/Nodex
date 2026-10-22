import connectPgSimple from "connect-pg-simple";
import type { Request } from "express";
import session from "express-session";
import { env } from "../config/env.js";

const PgStore = connectPgSimple(session);

export const SESSION_COOKIE = "nodex.sid";

export const sessionMiddleware = session({
  name: SESSION_COOKIE,
  secret: env.SESSION_SECRET,
  store: new PgStore({ conString: env.DATABASE_URL, tableName: "sessions" }),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  },
});

export function startSession(req: Request, userId: string) {
  return new Promise<void>((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) return reject(err);
      req.session.userId = userId;
      req.session.save((err) => (err ? reject(err) : resolve()));
    });
  });
}
