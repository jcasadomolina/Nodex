import { beforeAll, describe, expect, test, vi } from "vitest";
import { anonymous, createGroup, createNodex, newUser, warmUpAi, type Agent } from "../../test/helpers.js";

vi.mock("../links/links.service.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../links/links.service.js")>()),
  refreshPreviewInBackground: vi.fn(),
}));

beforeAll(warmUpAi);

async function kitchenWithOrphanRecipe(agent: Agent) {
  const kitchen = await createGroup(agent, "Cocina");
  await createNodex(agent, { title: "Receta de lentejas con chorizo", content: "Cocer las lentejas con chorizo y verdura", groupIds: [kitchen.id] });
  await createNodex(agent, { title: "Garbanzos con espinacas", content: "Receta de garbanzos guisados con espinacas", groupIds: [kitchen.id] });
  const orphan = await createNodex(agent, { title: "Lentejas estofadas", content: "Receta de lentejas con chorizo, patata y zanahoria" });
  await agent.post("/api/suggestions/refresh");
  const { body } = await agent.get("/api/suggestions");
  const suggestion = body.suggestions.find((s: { nodex: { id: string } }) => s.nodex.id === orphan.id);
  return { kitchen, orphan, suggestion };
}

async function lisbonOrphans(agent: Agent) {
  await createNodex(agent, { title: "Viaje a Lisboa", content: "Vuelos, hotel y barrios que visitar en Lisboa" });
  await createNodex(agent, { title: "Qué ver en Lisboa", content: "Alfama, Belém y el tranvía 28 de Lisboa" });
  await createNodex(agent, { title: "Dónde comer en Lisboa", content: "Pastéis de Belém y restaurantes de Lisboa" });
  expect((await agent.post("/api/suggestions/refresh")).body.newGroups).toBe(1);
  const res = await agent.get("/api/suggestions");
  return res.body.newGroups as { name: string; nodexs: { id: string }[] }[];
}

describe("sugerencias de grupo", { timeout: 120_000 }, () => {
  test("sin sesión da 401", async () => {
    expect((await anonymous().get("/api/suggestions")).status).toBe(401);
  });

  test("propone el grupo que encaja con un huérfano", async () => {
    const { agent } = await newUser();
    const { kitchen, suggestion } = await kitchenWithOrphanRecipe(agent);
    expect(suggestion?.group).toEqual({ id: kitchen.id, name: "Cocina" });
  });

  test("aceptar mete el Nodex en el grupo", async () => {
    const { agent } = await newUser();
    const { kitchen, orphan, suggestion } = await kitchenWithOrphanRecipe(agent);
    expect((await agent.post(`/api/suggestions/${suggestion.id}/accept`)).status).toBe(204);
    expect((await agent.get(`/api/nodexs/${orphan.id}`)).body.nodex.groupIds).toEqual([kitchen.id]);
    expect((await agent.post(`/api/suggestions/${suggestion.id}/accept`)).status).toBe(404);
  });

  test("rechazar la quita de la lista", async () => {
    const { agent } = await newUser();
    const { orphan, suggestion } = await kitchenWithOrphanRecipe(agent);
    expect((await agent.post(`/api/suggestions/${suggestion.id}/reject`)).status).toBe(204);
    expect((await agent.get(`/api/nodexs/${orphan.id}`)).body.nodex.groupIds).toEqual([]);
    const ids = (await agent.get("/api/suggestions")).body.suggestions.map((s: { id: string }) => s.id);
    expect(ids).not.toContain(suggestion.id);
  });
});

describe("grupos nuevos", { timeout: 120_000 }, () => {
  test("propone un grupo con tres huérfanos parecidos y aceptarlo lo crea", async () => {
    const { agent } = await newUser();
    const [proposal] = await lisbonOrphans(agent);
    expect(proposal?.nodexs).toHaveLength(3);

    const res = await agent.post("/api/suggestions/new-groups/accept").send({ name: proposal!.name, groupName: "Lisboa" });
    expect(res.status).toBe(201);
    const board = (await agent.get("/api/board")).body;
    expect(board.groups[0]).toMatchObject({ name: "Lisboa", nodexIds: expect.arrayContaining(proposal!.nodexs.map((n) => n.id)) });
    expect(board.orphanIds).toEqual([]);
  });

  test("aceptarla con el nombre de un grupo que ya existe da 409", async () => {
    const { agent } = await newUser();
    await createGroup(agent, "Lisboa");
    const [proposal] = await lisbonOrphans(agent);
    const res = await agent.post("/api/suggestions/new-groups/accept").send({ name: proposal!.name, groupName: "Lisboa" });
    expect(res.status).toBe(409);
  });

  test("una propuesta rechazada no vuelve", async () => {
    const { agent } = await newUser();
    const [proposal] = await lisbonOrphans(agent);
    expect((await agent.post("/api/suggestions/new-groups/reject").send({ name: proposal!.name })).status).toBe(204);
    expect((await agent.post("/api/suggestions/refresh")).body.newGroups).toBe(0);
    expect((await agent.get("/api/suggestions")).body.newGroups).toEqual([]);
  });
});

describe("aislamiento entre usuarios", { timeout: 120_000 }, () => {
  test("otro usuario no ve, acepta ni rechaza sugerencias ajenas", async () => {
    const { agent: a } = await newUser();
    const { agent: b } = await newUser();
    const { suggestion } = await kitchenWithOrphanRecipe(a);
    const [proposal] = await lisbonOrphans(a);

    expect((await b.get("/api/suggestions")).body).toEqual({ suggestions: [], newGroups: [] });
    expect((await b.post(`/api/suggestions/${suggestion.id}/accept`)).status).toBe(404);
    expect((await b.post(`/api/suggestions/${suggestion.id}/reject`)).status).toBe(404);
    expect((await b.post("/api/suggestions/new-groups/accept").send({ name: proposal!.name, groupName: "Robado" })).status).toBe(404);
    expect((await b.post("/api/suggestions/new-groups/reject").send({ name: proposal!.name })).status).toBe(404);
  });
});
