import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError, z } from "zod";
import { HttpError } from "../lib/http-error.js";

// Cualquier ruta que no exista
export const notFound: RequestHandler = (_req, _res, next) => {
  next(new HttpError(404, "Ruta no encontrada"));
};

// Express 5 envía aquí los errores lanzados en cualquier ruta, también en las async.
// Express reconoce este middleware como gestor de errores porque tiene 4 parámetros.
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({ error: "Datos no válidos", details: z.flattenError(err).fieldErrors });
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }

  // Errores de cliente que generan los propios middlewares de Express, como
  // un JSON mal formado (express.json) o un cuerpo demasiado grande
  if (typeof err?.status === "number" && err.status >= 400 && err.status < 500) {
    const message = err.type === "entity.parse.failed" ? "El JSON enviado no es válido" : "Petición no válida";
    res.status(err.status).json({ error: message });
    return;
  }

  // Error inesperado: se registra entero en el servidor, pero al cliente no se
  // le dan detalles internos
  console.error(err);
  res.status(500).json({ error: "Error interno del servidor" });
};
