import { beforeAll, describe, expect, test, vi } from "vitest";
import { prisma } from "../../lib/prisma.js";
import { anonymous, createGroup, createNodex, newUser, waitForEmbeddings, warmUpAi } from "../../test/helpers.js";

vi.mock("../links/links.service.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../links/links.service.js")>()),
  refreshPreviewInBackground: vi.fn(),
}));

const DAY = 24 * 60 * 60 * 1000;

beforeAll(warmUpAi);

describe("crear y editar Nodexs", () => {
  test("sin sesión da 401", async () => {
    expect((await anonymous().get("/api/nodexs")).status).toBe(401);
  });

  test("crea una nota", async () => {
    const { agent } = await newUser();
    const res = await agent.post("/api/nodexs").send({ type: "note", title: "Mi nota", content: "Hola", priority: "high", tags: ["Viajes"] });
    expect(res.status).toBe(201);
    expect(res.body.nodex).toMatchObject({ type: "note", title: "Mi nota", content: "Hola", priority: "high", tags: ["viajes"], source: "manual" });
  });

  test("crea un enlace", async () => {
    const { agent } = await newUser();
    const nodex = await createNodex(agent, { title: "MDN", url: "https://developer.mozilla.org/es/" });
    expect(nodex.type).toBe("link");
  });

  test("un Nodex sin título da 400", async () => {
    const { agent } = await newUser();
    const res = await agent.post("/api/nodexs").send({ type: "note", title: " " });
    expect(res.status).toBe(400);
    expect(res.body.details.title).toBeDefined();
  });

  test("no se puede meter en el grupo de otro usuario", async () => {
    const { agent: a } = await newUser();
    const { agent: b } = await newUser();
    const group = await createGroup(a);
    const res = await b.post("/api/nodexs").send({ type: "note", title: "x", groupIds: [group.id] });
    expect(res.status).toBe(404);
  });

  test("edita el título, la prioridad y las etiquetas", async () => {
    const { agent } = await newUser();
    const nodex = await createNodex(agent, { tags: ["a"] });
    const res = await agent.patch(`/api/nodexs/${nodex.id}`).send({ title: "Nuevo", priority: null, tags: ["b", "c"] });
    expect(res.status).toBe(200);
    expect(res.body.nodex).toMatchObject({ title: "Nuevo", priority: null, tags: ["b", "c"] });
  });

  test("poner o quitar la URL cambia el tipo", async () => {
    const { agent } = await newUser();
    const nodex = await createNodex(agent);
    const link = await agent.patch(`/api/nodexs/${nodex.id}`).send({ url: "https://ejemplo.com" });
    expect(link.body.nodex.type).toBe("link");
    const note = await agent.patch(`/api/nodexs/${nodex.id}`).send({ url: null });
    expect(note.body.nodex.type).toBe("note");
  });

  test("borrar lo manda a la papelera", async () => {
    const { agent } = await newUser();
    const nodex = await createNodex(agent);
    expect((await agent.delete(`/api/nodexs/${nodex.id}`)).status).toBe(204);
    expect((await agent.get(`/api/nodexs/${nodex.id}`)).status).toBe(404);
  });

  test("un id que no es un uuid da 404", async () => {
    const { agent } = await newUser();
    expect((await agent.get("/api/nodexs/no-es-un-id")).status).toBe(404);
  });
});

describe("listar", () => {
  test("filtra por grupo y por huérfanos", async () => {
    const { agent } = await newUser();
    const group = await createGroup(agent);
    const inGroup = await createNodex(agent, { groupIds: [group.id] });
    const orphan = await createNodex(agent);

    const byGroup = await agent.get(`/api/nodexs?groupId=${group.id}`);
    expect(byGroup.body.nodexs.map((n: { id: string }) => n.id)).toEqual([inGroup.id]);
    const orphans = await agent.get("/api/nodexs?orphan=true");
    expect(orphans.body.nodexs.map((n: { id: string }) => n.id)).toEqual([orphan.id]);
  });

  test("filtra por prioridad", async () => {
    const { agent } = await newUser();
    const urgent = await createNodex(agent, { priority: "urgent" });
    await createNodex(agent, { priority: "low" });
    const res = await agent.get("/api/nodexs?priority=urgent");
    expect(res.body.nodexs.map((n: { id: string }) => n.id)).toEqual([urgent.id]);
  });

  test("pagina con el cursor", async () => {
    const { agent } = await newUser();
    for (let i = 0; i < 3; i++) await createNodex(agent, { title: `Nodex ${i}` });
    const first = await agent.get("/api/nodexs?limit=2");
    expect(first.body.nodexs).toHaveLength(2);
    const second = await agent.get(`/api/nodexs?limit=2&cursor=${first.body.nextCursor}`);
    expect(second.body.nodexs).toHaveLength(1);
    expect(second.body.nextCursor).toBe(null);
  });

  test("leer más tarde solo vale para enlaces y se cuenta", async () => {
    const { agent } = await newUser();
    const link = await createNodex(agent, { url: "https://ejemplo.com/a", readLater: true });
    await createNodex(agent, { readLater: true });
    const list = await agent.get("/api/nodexs?readLater=true");
    expect(list.body.nodexs.map((n: { id: string }) => n.id)).toEqual([link.id]);
    expect((await agent.get("/api/nodexs/read-later/count")).body).toEqual({ count: 1 });
  });
});

describe("IA: búsqueda, relacionados y duplicados", () => {
  test("encuentra por significado", async () => {
    const { agent } = await newUser();
    const recipe = await createNodex(agent, { title: "Receta de lentejas con chorizo", content: "Cocer las lentejas con verdura y chorizo" });
    const git = await createNodex(agent, { title: "Configurar Git en Windows" });
    await waitForEmbeddings([recipe.id, git.id]);
    const res = await agent.get(`/api/nodexs/search?q=${encodeURIComponent("guiso de legumbres")}`);
    expect(res.body.nodexs[0]?.id).toBe(recipe.id);
  });

  test("una búsqueda vacía da 400", async () => {
    const { agent } = await newUser();
    expect((await agent.get("/api/nodexs/search?q=")).status).toBe(400);
  });

  test("muestra los relacionados", async () => {
    const { agent } = await newUser();
    const trip = await createNodex(agent, { title: "Viaje a Lisboa", content: "Vuelos, hotel y barrios que visitar en Lisboa" });
    const guide = await createNodex(agent, { title: "Qué ver en Lisboa", content: "Alfama, Belém y el tranvía 28" });
    const git = await createNodex(agent, { title: "Configurar Git en Windows" });
    await waitForEmbeddings([trip.id, guide.id, git.id]);
    const res = await agent.get(`/api/nodexs/${trip.id}/related`);
    expect(res.body.nodexs.map((n: { id: string }) => n.id)).toEqual([guide.id]);
  });

  test("avisa de un enlace repetido", async () => {
    const { agent } = await newUser();
    const first = await createNodex(agent, { url: "https://ejemplo.com/articulo" });
    const res = await agent.post("/api/nodexs").send({ type: "link", title: "Otra vez", url: "https://ejemplo.com/articulo/" });
    expect(res.status).toBe(201);
    expect(res.body.duplicates.map((n: { id: string }) => n.id)).toContain(first.id);
  });
});

describe("Redescubre", () => {
  test("abrir un Nodex guarda la fecha", async () => {
    const { agent } = await newUser();
    const nodex = await createNodex(agent);
    expect((await agent.post(`/api/nodexs/${nodex.id}/open`)).status).toBe(204);
    const row = await prisma.nodex.findUniqueOrThrow({ where: { id: nodex.id } });
    expect(row.lastOpenedAt).not.toBe(null);
  });

  test("muestra los olvidados, salvo los urgentes", async () => {
    const { agent } = await newUser();
    const forgotten = await createNodex(agent, { title: "Olvidado" });
    const urgent = await createNodex(agent, { title: "Urgente", priority: "urgent" });
    const old = new Date(Date.now() - 40 * DAY);
    await prisma.nodex.updateMany({ where: { id: { in: [forgotten.id, urgent.id] } }, data: { createdAt: old, lastOpenedAt: old } });

    const ids = (await agent.get("/api/nodexs/rediscover")).body.nodexs.map((n: { id: string }) => n.id);
    expect(ids).toContain(forgotten.id);
    expect(ids).not.toContain(urgent.id);
  });
});

describe("aislamiento entre usuarios", () => {
  test("otro usuario no puede ver, editar, borrar ni abrir un Nodex ajeno", async () => {
    const { agent: a } = await newUser();
    const { agent: b } = await newUser();
    const nodex = await createNodex(a, { title: "Secreto de A" });

    expect((await b.get(`/api/nodexs/${nodex.id}`)).status).toBe(404);
    expect((await b.patch(`/api/nodexs/${nodex.id}`).send({ title: "x" })).status).toBe(404);
    expect((await b.delete(`/api/nodexs/${nodex.id}`)).status).toBe(404);
    expect((await b.get(`/api/nodexs/${nodex.id}/related`)).status).toBe(404);
    expect((await b.post(`/api/nodexs/${nodex.id}/open`)).status).toBe(404);
    expect((await a.get(`/api/nodexs/${nodex.id}`)).body.nodex.title).toBe("Secreto de A");
  });

  test("las listas y la búsqueda no muestran Nodexs ajenos", async () => {
    const { agent: a } = await newUser();
    const { agent: b } = await newUser();
    await createNodex(a, { title: "Receta secreta de croquetas" });

    expect((await b.get("/api/nodexs")).body.nodexs).toEqual([]);
    expect((await b.get(`/api/nodexs/search?q=croquetas`)).body.nodexs).toEqual([]);
    expect((await b.get("/api/nodexs/read-later/count")).body).toEqual({ count: 0 });
  });
});
