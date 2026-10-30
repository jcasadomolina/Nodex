import { describe, expect, test, vi } from "vitest";
import { anonymous, createGroup, createNodex, newUser } from "../../test/helpers.js";

vi.mock("../links/links.service.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../links/links.service.js")>()),
  refreshPreviewInBackground: vi.fn(),
}));

describe("grupos", () => {
  test("sin sesión da 401", async () => {
    expect((await anonymous().get("/api/groups")).status).toBe(401);
  });

  test("crea, renombra y borra un grupo", async () => {
    const { agent } = await newUser();
    const group = await createGroup(agent, "Cocina");
    const renamed = await agent.patch(`/api/groups/${group.id}`).send({ name: "Recetas" });
    expect(renamed.body.group.name).toBe("Recetas");
    expect((await agent.delete(`/api/groups/${group.id}`)).status).toBe(204);
    expect((await agent.get("/api/groups")).body.groups).toEqual([]);
  });

  test("un nombre vacío da 400", async () => {
    const { agent } = await newUser();
    expect((await agent.post("/api/groups").send({ name: "" })).status).toBe(400);
  });

  test("un nombre repetido da 409, al crear y al renombrar", async () => {
    const { agent } = await newUser();
    await createGroup(agent, "Cocina");
    const other = await createGroup(agent, "Viajes");
    expect((await agent.post("/api/groups").send({ name: "Cocina" })).status).toBe(409);
    expect((await agent.patch(`/api/groups/${other.id}`).send({ name: "Cocina" })).status).toBe(409);
  });

  test("dos usuarios pueden tener un grupo con el mismo nombre", async () => {
    const { agent: a } = await newUser();
    const { agent: b } = await newUser();
    await createGroup(a, "Cocina");
    expect((await b.post("/api/groups").send({ name: "Cocina" })).status).toBe(201);
  });

  test("añade y quita Nodexs, y los cuenta", async () => {
    const { agent } = await newUser();
    const group = await createGroup(agent);
    const nodex = await createNodex(agent);
    expect((await agent.post(`/api/groups/${group.id}/nodexs`).send({ nodexId: nodex.id })).status).toBe(204);
    expect((await agent.get("/api/groups")).body.groups[0].nodexCount).toBe(1);
    expect((await agent.delete(`/api/groups/${group.id}/nodexs/${nodex.id}`)).status).toBe(204);
    expect((await agent.delete(`/api/groups/${group.id}/nodexs/${nodex.id}`)).status).toBe(404);
  });

  test("añadir dos veces el mismo Nodex no lo duplica", async () => {
    const { agent } = await newUser();
    const group = await createGroup(agent);
    const nodex = await createNodex(agent);
    await agent.post(`/api/groups/${group.id}/nodexs`).send({ nodexId: nodex.id });
    await agent.post(`/api/groups/${group.id}/nodexs`).send({ nodexId: nodex.id });
    expect((await agent.get("/api/groups")).body.groups[0].nodexCount).toBe(1);
  });
});

describe("aislamiento entre usuarios", () => {
  test("otro usuario no puede ver, editar ni borrar un grupo ajeno", async () => {
    const { agent: a } = await newUser();
    const { agent: b } = await newUser();
    const group = await createGroup(a, "Privado");
    expect((await b.get("/api/groups")).body.groups).toEqual([]);
    expect((await b.patch(`/api/groups/${group.id}`).send({ name: "x" })).status).toBe(404);
    expect((await b.delete(`/api/groups/${group.id}`)).status).toBe(404);
    expect((await a.get("/api/groups")).body.groups[0].name).toBe("Privado");
  });

  test("no se pueden mezclar grupos y Nodexs de usuarios distintos", async () => {
    const { agent: a } = await newUser();
    const { agent: b } = await newUser();
    const groupA = await createGroup(a);
    const nodexA = await createNodex(a);
    const groupB = await createGroup(b);
    const nodexB = await createNodex(b);
    expect((await b.post(`/api/groups/${groupA.id}/nodexs`).send({ nodexId: nodexB.id })).status).toBe(404);
    expect((await b.post(`/api/groups/${groupB.id}/nodexs`).send({ nodexId: nodexA.id })).status).toBe(404);
  });
});
