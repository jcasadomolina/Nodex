import request from "supertest";
import { describe, expect, test, vi } from "vitest";
import { app } from "../../app.js";
import { newUser, PASSWORD } from "../../test/helpers.js";

vi.mock("../links/links.service.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../links/links.service.js")>()),
  refreshPreviewInBackground: vi.fn(),
}));

const HOUR = 60 * 60 * 1000;

async function newDemo() {
  const agent = request.agent(app);
  const res = await agent.post("/api/auth/demo");
  return { agent, res };
}

describe("modo demo", { timeout: 120_000 }, () => {
  test("crea la cuenta con los datos de ejemplo y la IA calculada", async () => {
    const { agent, res } = await newDemo();
    expect(res.status).toBe(201);
    const expiresIn = new Date(res.body.user.demoExpiresAt).getTime() - Date.now();
    expect(expiresIn).toBeGreaterThan(23 * HOUR);
    expect(expiresIn).toBeLessThanOrEqual(24 * HOUR);

    const board = await agent.get("/api/board");
    expect(board.body.groups).toHaveLength(4);
    expect(board.body.nodexs).toHaveLength(26);
    const suggestions = await agent.get("/api/suggestions");
    expect(suggestions.body.suggestions.length).toBeGreaterThan(0);
    expect((await agent.get("/api/nodexs/pending-embeddings")).body.nodexs).toEqual([]);
  });

  test("en la demo no se puede subir foto ni vincular cuentas", async () => {
    const { agent } = await newDemo();
    expect((await agent.put("/api/me/avatar")).status).toBe(403);
    expect((await agent.get("/api/auth/google/link")).status).toBe(403);
  });

  test("convertir la demo conserva sus datos", async () => {
    const { agent } = await newDemo();
    const before = (await agent.get("/api/nodexs")).body.nodexs.length;
    const email = `convertida-${Date.now()}@ejemplo.com`;
    const res = await agent.post("/api/auth/demo/convert").send({ name: "Ana", email, password: PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ name: "Ana", email, demoExpiresAt: null });
    expect((await agent.get("/api/nodexs")).body.nodexs.length).toBe(before);
    expect((await agent.post("/api/auth/demo/convert").send({ name: "Ana", email, password: PASSWORD })).status).toBe(403);
  });

  test("convertir con un email ya usado da 409", async () => {
    const { user } = await newUser();
    const { agent } = await newDemo();
    const res = await agent.post("/api/auth/demo/convert").send({ name: "Ana", email: user.email, password: PASSWORD });
    expect(res.status).toBe(409);
  });

  test("una cuenta normal no se puede convertir", async () => {
    const { agent } = await newUser();
    const res = await agent.post("/api/auth/demo/convert").send({ name: "Ana", email: "x@ejemplo.com", password: PASSWORD });
    expect(res.status).toBe(403);
  });

  test("la sexta demo en una hora da 429", async () => {
    for (let i = 0; i < 5; i++) await request(app).post("/api/auth/demo");
    expect((await request(app).post("/api/auth/demo")).status).toBe(429);
  });
});
