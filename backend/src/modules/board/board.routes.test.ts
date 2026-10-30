import { describe, expect, test, vi } from "vitest";
import { anonymous, createGroup, createNodex, newUser, waitForEmbeddings, warmUpAi } from "../../test/helpers.js";

vi.mock("../links/links.service.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../links/links.service.js")>()),
  refreshPreviewInBackground: vi.fn(),
}));

describe("panel", () => {
  test("sin sesión da 401", async () => {
    expect((await anonymous().get("/api/board")).status).toBe(401);
  });

  test("devuelve los grupos con sus Nodexs y los huérfanos", async () => {
    const { agent } = await newUser();
    const group = await createGroup(agent, "Cocina");
    const inGroup = await createNodex(agent, { groupIds: [group.id] });
    const orphan = await createNodex(agent);

    const { body } = await agent.get("/api/board");
    expect(body.groups).toEqual([{ id: group.id, name: "Cocina", description: null, nodexIds: [inGroup.id] }]);
    expect(body.orphanIds).toEqual([orphan.id]);
    expect(body.nodexs).toHaveLength(2);
  });

  test("devuelve parejas de relacionados", { timeout: 120_000 }, async () => {
    await warmUpAi();
    const { agent } = await newUser();
    const trip = await createNodex(agent, { title: "Viaje a Lisboa", content: "Vuelos, hotel y barrios que visitar en Lisboa" });
    const guide = await createNodex(agent, { title: "Qué ver en Lisboa", content: "Alfama, Belém y el tranvía 28" });
    const git = await createNodex(agent, { title: "Configurar Git en Windows" });
    await waitForEmbeddings([trip.id, guide.id, git.id]);

    const { pairs } = (await agent.get("/api/board/related")).body;
    expect(pairs).toHaveLength(1);
    expect([pairs[0].a, pairs[0].b].sort()).toEqual([trip.id, guide.id].sort());

    const { agent: other } = await newUser();
    expect((await other.get("/api/board/related")).body.pairs).toEqual([]);
  });
});

describe("etiquetas", () => {
  test("cuenta cuántos Nodexs tiene cada etiqueta", async () => {
    const { agent } = await newUser();
    await createNodex(agent, { tags: ["viajes", "lisboa"] });
    await createNodex(agent, { tags: ["viajes"] });
    const res = await agent.get("/api/tags");
    expect(res.body.tags).toEqual([
      { name: "lisboa", nodexCount: 1 },
      { name: "viajes", nodexCount: 2 },
    ]);
  });

  test("no cuenta los Nodexs de la papelera", async () => {
    const { agent } = await newUser();
    const nodex = await createNodex(agent, { tags: ["viajes"] });
    await agent.delete(`/api/nodexs/${nodex.id}`);
    expect((await agent.get("/api/tags")).body.tags).toEqual([]);
  });
});

describe("aislamiento entre usuarios", () => {
  test("el panel y las etiquetas no muestran nada ajeno", async () => {
    const { agent: a } = await newUser();
    const { agent: b } = await newUser();
    await createGroup(a);
    await createNodex(a, { tags: ["secreto"] });
    expect((await b.get("/api/board")).body).toEqual({ groups: [], nodexs: [], orphanIds: [] });
    expect((await b.get("/api/tags")).body.tags).toEqual([]);
    expect((await b.get("/api/board/related")).body.pairs).toEqual([]);
  });
});
