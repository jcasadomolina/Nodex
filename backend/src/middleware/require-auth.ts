import type { RequestHandler } from "express";
import { HttpError } from "../lib/http-error.js";

export const requireAuth: RequestHandler = (req, _res, next) => {
  if (!req.session.userId) {
    throw new HttpError(401, "Debes iniciar sesión");
  }
  next();
};
