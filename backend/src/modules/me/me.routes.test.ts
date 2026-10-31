import { describe, expect, test, vi } from "vitest";
import { prisma } from "../../lib/prisma.js";
import { anonymous, newUser } from "../../test/helpers.js";

const storage = vi.hoisted(() => ({ enabled: true, fail: false }));

vi.mock("../../lib/storage.js", () => ({
  get storageEnabled() {
    return storage.enabled;
  },
  uploadAvatar: vi.fn(async () => {
    if (storage.fail) throw new Error("Cloudinary caído");
    return "https://res.cloudinary.com/nodex/avatar.webp";
  }),
  deleteAvatar: vi.fn(async () => {}),
}));

const PNG = Buffer.from("89504e470d0a1a0a", "hex");

function upload(agent: Awaited<ReturnType<typeof newUser>>["agent"]) {
  return agent.put("/api/me/avatar").attach("avatar", PNG, { filename: "foto.png", contentType: "image/png" });
}

describe("perfil", () => {
  test("sin sesión da 401", async () => {
    expect((await anonymous().get("/api/me")).status).toBe(401);
  });

  test("devuelve el perfil con sus métodos de entrada", async () => {
    const { agent, user } = await newUser();
    const res = await agent.get("/api/me");
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ id: user.id, hasPassword: true, providers: [] });
  });

  test("cambia el nombre", async () => {
    const { agent } = await newUser();
    const res = await agent.patch("/api/me").send({ name: "Nuevo nombre" });
    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe("Nuevo nombre");
  });

  test("un nombre vacío da 400", async () => {
    const { agent } = await newUser();
    expect((await agent.patch("/api/me").send({ name: "  " })).status).toBe(400);
  });

  test("guarda la versión del tutorial", async () => {
    const { agent } = await newUser();
    const res = await agent.put("/api/me/tutorial").send({ version: 2 });
    expect(res.body).toEqual({ tutorialCompletedVersion: 2 });
  });
});

describe("foto de perfil", () => {
  test("sube la foto", async () => {
    storage.enabled = true;
    const { agent } = await newUser();
    const res = await upload(agent);
    expect(res.status).toBe(200);
    expect(res.body.user.avatarUrl).toBe("https://res.cloudinary.com/nodex/avatar.webp");
  });

  test("sin archivo da 400", async () => {
    storage.enabled = true;
    const { agent } = await newUser();
    expect((await agent.put("/api/me/avatar")).status).toBe(400);
  });

  test("si Cloudinary falla da 502", async () => {
    storage.enabled = true;
    storage.fail = true;
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { agent } = await newUser();
    expect((await upload(agent)).status).toBe(502);
    storage.fail = false;
  });

  test("sin Cloudinary configurado da 503", async () => {
    storage.enabled = false;
    const { agent } = await newUser();
    expect((await upload(agent)).status).toBe(503);
    storage.enabled = true;
  });

  test("quitar la foto la deja en null", async () => {
    const { agent } = await newUser();
    await upload(agent);
    const res = await agent.delete("/api/me/avatar");
    expect(res.body.user.avatarUrl).toBe(null);
  });
});

describe("cuentas vinculadas", () => {
  test("desvincula una cuenta si queda otro método", async () => {
    const { agent, user } = await newUser();
    await prisma.oAuthAccount.create({ data: { userId: user.id, provider: "google", providerAccountId: `g-${user.id}` } });
    expect((await agent.delete("/api/me/providers/google")).status).toBe(204);
  });

  test("no deja desvincular el único método de entrada", async () => {
    const { agent, user } = await newUser();
    await prisma.oAuthAccount.create({ data: { userId: user.id, provider: "github", providerAccountId: `gh-${user.id}` } });
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: null } });
    expect((await agent.delete("/api/me/providers/github")).status).toBe(409);
  });

  test("una cuenta que no está vinculada da 404", async () => {
    const { agent } = await newUser();
    expect((await agent.delete("/api/me/providers/google")).status).toBe(404);
  });
});
