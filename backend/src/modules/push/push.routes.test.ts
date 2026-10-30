import { describe, expect, test, vi } from "vitest";
import { prisma } from "../../lib/prisma.js";
import { anonymous, newUser } from "../../test/helpers.js";

const push = vi.hoisted(() => ({ enabled: true }));

vi.mock("../../lib/push.js", () => ({
  get pushEnabled() {
    return push.enabled;
  },
  sendPush: vi.fn(),
}));

vi.mock("../../config/env.js", async (importOriginal) => {
  const { env } = await importOriginal<typeof import("../../config/env.js")>();
  return { env: { ...env, VAPID_PUBLIC_KEY: "clave-publica-de-prueba" } };
});

const subscription = (endpoint: string) => ({ endpoint, keys: { p256dh: "clave", auth: "auth" } });

describe("notificaciones push", () => {
  test("sin sesión da 401", async () => {
    expect((await anonymous().get("/api/push/public-key")).status).toBe(401);
  });

  test("da la clave pública", async () => {
    push.enabled = true;
    const { agent } = await newUser();
    expect((await agent.get("/api/push/public-key")).body).toEqual({ publicKey: "clave-publica-de-prueba" });
  });

  test("guarda y borra la suscripción del dispositivo", async () => {
    push.enabled = true;
    const { agent, user } = await newUser();
    const endpoint = `https://push.ejemplo.com/${user.id}`;
    expect((await agent.post("/api/push/subscriptions").send(subscription(endpoint))).status).toBe(204);
    expect(await prisma.pushSubscription.count({ where: { userId: user.id } })).toBe(1);
    expect((await agent.delete("/api/push/subscriptions").send({ endpoint })).status).toBe(204);
    expect(await prisma.pushSubscription.count({ where: { userId: user.id } })).toBe(0);
  });

  test("una dirección que no es https da 400", async () => {
    push.enabled = true;
    const { agent } = await newUser();
    expect((await agent.post("/api/push/subscriptions").send(subscription("http://push.ejemplo.com/x"))).status).toBe(400);
  });

  test("sin claves VAPID da 503", async () => {
    push.enabled = false;
    const { agent } = await newUser();
    expect((await agent.get("/api/push/public-key")).status).toBe(503);
    expect((await agent.post("/api/push/subscriptions").send(subscription("https://push.ejemplo.com/y"))).status).toBe(503);
    push.enabled = true;
  });

  test("no se puede borrar la suscripción de otro usuario", async () => {
    const { agent: a, user } = await newUser();
    const { agent: b } = await newUser();
    const endpoint = `https://push.ejemplo.com/a-${user.id}`;
    await a.post("/api/push/subscriptions").send(subscription(endpoint));
    await b.delete("/api/push/subscriptions").send({ endpoint });
    expect(await prisma.pushSubscription.count({ where: { endpoint } })).toBe(1);
  });
});
