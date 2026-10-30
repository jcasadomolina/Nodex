import { randomUUID } from "node:crypto";
import request from "supertest";
import { describe, expect, test } from "vitest";
import { app } from "../../app.js";
import { anonymous, newUser, PASSWORD } from "../../test/helpers.js";

describe("health", () => {
  test("responde que la base está bien", async () => {
    const res = await anonymous().get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok", database: "ok" });
  });
});

describe("registro", () => {
  test("crea la cuenta y abre la sesión", async () => {
    const email = `test-${randomUUID()}@ejemplo.com`;
    const res = await anonymous().post("/api/auth/register").send({ name: "Ana", email, password: PASSWORD });
    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ name: "Ana", email, demoExpiresAt: null });
    expect(res.headers["set-cookie"]?.[0]).toMatch(/^nodex\.sid=/);
  });

  test("guarda el email en minúsculas", async () => {
    const res = await anonymous().post("/api/auth/register").send({ name: "Ana", email: `TEST-${randomUUID()}@Ejemplo.com`, password: PASSWORD });
    expect(res.body.user.email).toBe(res.body.user.email.toLowerCase());
  });

  test("un email no válido da 400", async () => {
    const res = await anonymous().post("/api/auth/register").send({ name: "Ana", email: "no-es-un-email", password: PASSWORD });
    expect(res.status).toBe(400);
    expect(res.body.details.email).toBeDefined();
  });

  test("una contraseña corta da 400", async () => {
    const res = await anonymous().post("/api/auth/register").send({ name: "Ana", email: `test-${randomUUID()}@ejemplo.com`, password: "corta" });
    expect(res.status).toBe(400);
    expect(res.body.details.password).toBeDefined();
  });

  test("un email repetido da 409", async () => {
    const { user } = await newUser();
    const res = await anonymous().post("/api/auth/register").send({ name: "Otra", email: user.email, password: PASSWORD });
    expect(res.status).toBe(409);
  });
});

describe("login y sesión", () => {
  test("entra con el email y la contraseña", async () => {
    const { user } = await newUser();
    const agent = request.agent(app);
    const res = await agent.post("/api/auth/login").send({ email: user.email, password: PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(user.id);
    expect((await agent.get("/api/auth/me")).body.user.id).toBe(user.id);
  });

  test("una contraseña incorrecta da 401", async () => {
    const { user } = await newUser();
    const res = await anonymous().post("/api/auth/login").send({ email: user.email, password: "otra-contraseña" });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Email o contraseña incorrectos");
  });

  test("un email que no existe da el mismo 401", async () => {
    const res = await anonymous().post("/api/auth/login").send({ email: `nadie-${randomUUID()}@ejemplo.com`, password: PASSWORD });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Email o contraseña incorrectos");
  });

  test("me sin sesión da 401", async () => {
    expect((await anonymous().get("/api/auth/me")).status).toBe(401);
  });

  test("cerrar sesión borra la sesión", async () => {
    const { agent } = await newUser();
    expect((await agent.post("/api/auth/logout")).status).toBe(204);
    expect((await agent.get("/api/auth/me")).status).toBe(401);
  });

  test("el login se bloquea tras 10 intentos", async () => {
    const email = `nadie-${randomUUID()}@ejemplo.com`;
    for (let i = 0; i < 10; i++) await anonymous().post("/api/auth/login").send({ email, password: PASSWORD });
    const res = await anonymous().post("/api/auth/login").send({ email, password: PASSWORD });
    expect(res.status).toBe(429);
  });
});

describe("Google y GitHub", () => {
  test.each(["google", "github"])("sin configurar, %s da 503", async (provider) => {
    expect((await anonymous().get(`/api/auth/${provider}`)).status).toBe(503);
  });
});
