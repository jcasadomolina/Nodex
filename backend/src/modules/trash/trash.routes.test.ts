import { describe, expect, test, vi } from "vitest";
import { prisma } from "../../lib/prisma.js";
import { anonymous, createGroup, createNodex, newUser } from "../../test/helpers.js";
import { purgeTrash } from "./trash.worker.js";

vi.mock("../links/links.service.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../links/links.service.js")>()),
  refreshPreviewInBackground: vi.fn(),
}));

const DAY = 24 * 60 * 60 * 1000;

describe("papelera", () => {
  test("sin sesión da 401", async () => {
    expect((await anonymous().get("/api/trash")).status).toBe(401);
  });

  test("restaura un Nodex con sus grupos y etiquetas", async () => {
    const { agent } = await newUser();
    const group = await createGroup(agent);
    const nodex = await createNodex(agent, { groupIds: [group.id], tags: ["viajes"] });
    await agent.delete(`/api/nodexs/${nodex.id}`);

    const trash = await agent.get("/api/trash");
    expect(trash.body.nodexs.map((n: { id: string }) => n.id)).toEqual([nodex.id]);
    expect((await agent.post(`/api/trash/nodexs/${nodex.id}/restore`)).status).toBe(204);
    expect((await agent.get(`/api/nodexs/${nodex.id}`)).body.nodex).toMatchObject({ groupIds: [group.id], tags: ["viajes"] });
  });

  test("restaurar algo que no está en la papelera da 404", async () => {
    const { agent } = await newUser();
    const nodex = await createNodex(agent);
    expect((await agent.post(`/api/trash/nodexs/${nodex.id}/restore`)).status).toBe(404);
  });

  test("un grupo con el nombre ocupado vuelve como «(restaurado)»", async () => {
    const { agent } = await newUser();
    const group = await createGroup(agent, "Cocina");
    await agent.delete(`/api/groups/${group.id}`);
    await createGroup(agent, "Cocina");
    const res = await agent.post(`/api/trash/groups/${group.id}/restore`);
    expect(res.body.group.name).toBe("Cocina (restaurado)");
  });

  test("borrar para siempre y vaciar", async () => {
    const { agent } = await newUser();
    const one = await createNodex(agent);
    const two = await createNodex(agent);
    const group = await createGroup(agent);
    for (const id of [one.id, two.id]) await agent.delete(`/api/nodexs/${id}`);
    await agent.delete(`/api/groups/${group.id}`);

    expect((await agent.delete(`/api/trash/nodexs/${one.id}`)).status).toBe(204);
    expect(await prisma.nodex.count({ where: { id: one.id } })).toBe(0);
    expect((await agent.delete("/api/trash")).body).toEqual({ nodexs: 1, groups: 1 });
    expect((await agent.get("/api/trash")).body).toEqual({ nodexs: [], groups: [] });
  });

  test("no se puede borrar para siempre algo que no está en la papelera", async () => {
    const { agent } = await newUser();
    const nodex = await createNodex(agent);
    expect((await agent.delete(`/api/trash/nodexs/${nodex.id}`)).status).toBe(404);
    expect(await prisma.nodex.count({ where: { id: nodex.id } })).toBe(1);
  });

  test("otro usuario no ve, restaura, borra ni vacía la papelera ajena", async () => {
    const { agent: a } = await newUser();
    const { agent: b } = await newUser();
    const nodex = await createNodex(a);
    const group = await createGroup(a);
    await a.delete(`/api/nodexs/${nodex.id}`);
    await a.delete(`/api/groups/${group.id}`);

    expect((await b.get("/api/trash")).body).toEqual({ nodexs: [], groups: [] });
    expect((await b.post(`/api/trash/nodexs/${nodex.id}/restore`)).status).toBe(404);
    expect((await b.post(`/api/trash/groups/${group.id}/restore`)).status).toBe(404);
    expect((await b.delete(`/api/trash/nodexs/${nodex.id}`)).status).toBe(404);
    expect((await b.delete(`/api/trash/groups/${group.id}`)).status).toBe(404);
    await b.delete("/api/trash");
    expect((await a.get("/api/trash")).body.nodexs).toHaveLength(1);
  });
});

describe("limpieza de la papelera", () => {
  test("borra lo que lleva más de 30 días y deja lo reciente", async () => {
    const { agent } = await newUser();
    const old = await createNodex(agent);
    const recent = await createNodex(agent);
    await prisma.nodex.update({ where: { id: old.id }, data: { deletedAt: new Date(Date.now() - 31 * DAY) } });
    await prisma.nodex.update({ where: { id: recent.id }, data: { deletedAt: new Date(Date.now() - 29 * DAY) } });

    await purgeTrash();
    expect(await prisma.nodex.count({ where: { id: old.id } })).toBe(0);
    expect(await prisma.nodex.count({ where: { id: recent.id } })).toBe(1);
  });
});
