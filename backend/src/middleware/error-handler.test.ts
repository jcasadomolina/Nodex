import express from "express";
import request from "supertest";
import { expect, test, vi } from "vitest";
import { z } from "zod";
import { HttpError } from "../lib/http-error.js";
import { errorHandler, notFound } from "./error-handler.js";

const app = express();
app.use(express.json());
app.post("/zod", () => {
  z.object({ title: z.string() }).parse({});
});
app.get("/http", () => {
  throw new HttpError(409, "Ya existe");
});
app.post("/json", (_req, res) => {
  res.json({});
});
app.get("/roto", () => {
  throw new Error("secreto interno");
});
app.use(notFound);
app.use(errorHandler);

test("un ZodError da 400 con los campos que fallan", async () => {
  const res = await request(app).post("/zod");
  expect(res.status).toBe(400);
  expect(res.body.error).toBe("Datos no válidos");
  expect(res.body.details.title).toHaveLength(1);
});

test("un HttpError da su código y su mensaje", async () => {
  const res = await request(app).get("/http");
  expect(res.status).toBe(409);
  expect(res.body).toEqual({ error: "Ya existe" });
});

test("un JSON mal formado da 400", async () => {
  const res = await request(app).post("/json").set("Content-Type", "application/json").send("{roto");
  expect(res.status).toBe(400);
  expect(res.body.error).toBe("El JSON enviado no es válido");
});

test("un error inesperado da 500 sin filtrar detalles", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  const res = await request(app).get("/roto");
  expect(res.status).toBe(500);
  expect(JSON.stringify(res.body)).not.toContain("secreto");
});

test("una ruta que no existe da 404", async () => {
  const res = await request(app).get("/no-existe");
  expect(res.status).toBe(404);
});
