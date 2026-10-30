import { describe, expect, test, vi } from "vitest";
import { anonymous, createNodex, newUser, type Agent } from "../../test/helpers.js";

vi.mock("../links/links.service.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../links/links.service.js")>()),
  refreshPreviewInBackground: vi.fn(),
}));

async function newTask(agent: Agent, title: string, body: Record<string, unknown> = {}) {
  const nodex = await createNodex(agent, { title });
  const res = await agent.put(`/api/tasks/${nodex.id}`).send(body);
  expect(res.status).toBe(201);
  return nodex;
}

const titles = (cards: { nodex: { title: string } }[]) => cards.map((card) => card.nodex.title);

describe("tareas", () => {
  test("sin sesión da 401", async () => {
    expect((await anonymous().get("/api/tasks/board")).status).toBe(401);
  });

  test("convertir un Nodex en tarea la pone en pendiente", async () => {
    const { agent } = await newUser();
    await newTask(agent, "Estudiar SQL");
    const { columns } = (await agent.get("/api/tasks/board")).body;
    expect(titles(columns.todo)).toEqual(["Estudiar SQL"]);
    expect(columns.doing).toEqual([]);
  });

  test("marcarla como hecha guarda cuándo se completó", async () => {
    const { agent } = await newUser();
    const nodex = await newTask(agent, "Enviar CV");
    const res = await agent.put(`/api/tasks/${nodex.id}`).send({ status: "done" });
    expect(res.status).toBe(200);
    expect(res.body.task.completedAt).not.toBe(null);
    const back = await agent.put(`/api/tasks/${nodex.id}`).send({ status: "todo" });
    expect(back.body.task.completedAt).toBe(null);
  });

  test("un estado que no existe da 400", async () => {
    const { agent } = await newUser();
    const nodex = await createNodex(agent);
    expect((await agent.put(`/api/tasks/${nodex.id}`).send({ status: "pendiente" })).status).toBe(400);
  });

  test("mover cambia de columna y respeta la posición", async () => {
    const { agent } = await newUser();
    await newTask(agent, "A", { status: "doing" });
    await newTask(agent, "B", { status: "doing" });
    const moved = await newTask(agent, "C");

    const res = await agent.post(`/api/tasks/${moved.id}/move`).send({ status: "doing", index: 1 });
    expect(res.body.task.status).toBe("doing");
    const { columns } = (await agent.get("/api/tasks/board")).body;
    expect(titles(columns.doing)).toEqual(["A", "C", "B"]);
    expect(columns.todo).toEqual([]);
  });

  test("el calendario muestra las tareas del rango", async () => {
    const { agent } = await newUser();
    await newTask(agent, "Dentro", { dueAt: "2026-11-10T10:00:00Z" });
    await newTask(agent, "Fuera", { dueAt: "2027-03-01T10:00:00Z" });
    const res = await agent.get("/api/tasks/calendar?from=2026-11-01T00:00:00Z&to=2026-12-01T00:00:00Z");
    expect(titles(res.body.tasks)).toEqual(["Dentro"]);
  });

  test("un rango de calendario de más de 100 días da 400", async () => {
    const { agent } = await newUser();
    const res = await agent.get("/api/tasks/calendar?from=2026-01-01T00:00:00Z&to=2026-12-01T00:00:00Z");
    expect(res.status).toBe(400);
  });

  test("quitar la tarea deja el Nodex", async () => {
    const { agent } = await newUser();
    const nodex = await newTask(agent, "Temporal");
    expect((await agent.delete(`/api/tasks/${nodex.id}`)).status).toBe(204);
    expect((await agent.delete(`/api/tasks/${nodex.id}`)).status).toBe(404);
    expect((await agent.get(`/api/nodexs/${nodex.id}`)).status).toBe(200);
  });

  test("una tarea en la papelera no sale en el tablero", async () => {
    const { agent } = await newUser();
    const nodex = await newTask(agent, "Borrada");
    await agent.delete(`/api/nodexs/${nodex.id}`);
    expect((await agent.get("/api/tasks/board")).body.columns.todo).toEqual([]);
  });
});

describe("aislamiento entre usuarios", () => {
  test("otro usuario no ve, crea, mueve ni borra tareas ajenas", async () => {
    const { agent: a } = await newUser();
    const { agent: b } = await newUser();
    const nodex = await newTask(a, "Tarea de A", { dueAt: "2026-11-10T10:00:00Z" });

    expect((await b.get("/api/tasks/board")).body.columns.todo).toEqual([]);
    expect((await b.get("/api/tasks/calendar?from=2026-11-01T00:00:00Z&to=2026-12-01T00:00:00Z")).body.tasks).toEqual([]);
    expect((await b.put(`/api/tasks/${nodex.id}`).send({ status: "done" })).status).toBe(404);
    expect((await b.post(`/api/tasks/${nodex.id}/move`).send({ status: "done", index: 0 })).status).toBe(404);
    expect((await b.delete(`/api/tasks/${nodex.id}`)).status).toBe(404);
    expect(titles((await a.get("/api/tasks/board")).body.columns.todo)).toEqual(["Tarea de A"]);
  });
});
