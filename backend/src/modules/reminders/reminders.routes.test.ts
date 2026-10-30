import { describe, expect, test, vi } from "vitest";
import { prisma } from "../../lib/prisma.js";
import { sendPush } from "../../lib/push.js";
import { anonymous, createNodex, newUser } from "../../test/helpers.js";
import { sendDueReminders } from "./reminders.worker.js";

vi.mock("../links/links.service.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../links/links.service.js")>()),
  refreshPreviewInBackground: vi.fn(),
}));

vi.mock("../../lib/push.js", () => ({
  pushEnabled: true,
  sendPush: vi.fn(async () => "sent"),
}));

const HOUR = 60 * 60 * 1000;
const inOneHour = () => new Date(Date.now() + HOUR).toISOString();

async function makeDue(nodexId: string) {
  await prisma.reminder.update({ where: { nodexId }, data: { remindAt: new Date(Date.now() - 60_000) } });
}

describe("recordatorios", () => {
  test("sin sesión da 401", async () => {
    expect((await anonymous().get("/api/reminders")).status).toBe(401);
  });

  test("programa un recordatorio y sale en los próximos", async () => {
    const { agent } = await newUser();
    const nodex = await createNodex(agent, { title: "Llamar al médico" });
    const res = await agent.put(`/api/reminders/${nodex.id}`).send({ remindAt: inOneHour() });
    expect(res.status).toBe(200);
    const list = await agent.get("/api/reminders");
    expect(list.body.reminders.map((r: { nodex: { title: string } }) => r.nodex.title)).toEqual(["Llamar al médico"]);
  });

  test("una fecha pasada da 400", async () => {
    const { agent } = await newUser();
    const nodex = await createNodex(agent);
    const res = await agent.put(`/api/reminders/${nodex.id}`).send({ remindAt: new Date(Date.now() - HOUR).toISOString() });
    expect(res.status).toBe(400);
    expect(res.body.details.remindAt).toEqual(["El recordatorio debe ser en el futuro"]);
  });

  test("los vencidos salen hasta que se descartan", async () => {
    const { agent } = await newUser();
    const nodex = await createNodex(agent);
    await agent.put(`/api/reminders/${nodex.id}`).send({ remindAt: inOneHour() });
    await makeDue(nodex.id);

    expect((await agent.get("/api/reminders?status=due")).body.reminders).toHaveLength(1);
    expect((await agent.post(`/api/reminders/${nodex.id}/dismiss`)).status).toBe(204);
    expect((await agent.get("/api/reminders?status=due")).body.reminders).toEqual([]);
  });

  test("no se puede descartar uno que aún no ha llegado", async () => {
    const { agent } = await newUser();
    const nodex = await createNodex(agent);
    await agent.put(`/api/reminders/${nodex.id}`).send({ remindAt: inOneHour() });
    expect((await agent.post(`/api/reminders/${nodex.id}/dismiss`)).status).toBe(404);
  });

  test("quitar el recordatorio", async () => {
    const { agent } = await newUser();
    const nodex = await createNodex(agent);
    await agent.put(`/api/reminders/${nodex.id}`).send({ remindAt: inOneHour() });
    expect((await agent.delete(`/api/reminders/${nodex.id}`)).status).toBe(204);
    expect((await agent.delete(`/api/reminders/${nodex.id}`)).status).toBe(404);
  });

  test("otro usuario no ve, cambia, descarta ni borra recordatorios ajenos", async () => {
    const { agent: a } = await newUser();
    const { agent: b } = await newUser();
    const nodex = await createNodex(a);
    await a.put(`/api/reminders/${nodex.id}`).send({ remindAt: inOneHour() });

    expect((await b.get("/api/reminders")).body.reminders).toEqual([]);
    expect((await b.put(`/api/reminders/${nodex.id}`).send({ remindAt: inOneHour() })).status).toBe(404);
    expect((await b.delete(`/api/reminders/${nodex.id}`)).status).toBe(404);
    await makeDue(nodex.id);
    expect((await b.post(`/api/reminders/${nodex.id}/dismiss`)).status).toBe(404);
  });
});

describe("envío de los recordatorios vencidos", () => {
  async function dueReminderWithSubscription() {
    const { agent, user } = await newUser();
    const nodex = await createNodex(agent, { title: "Aviso" });
    await agent.put(`/api/reminders/${nodex.id}`).send({ remindAt: inOneHour() });
    const endpoint = `https://push.ejemplo.com/${nodex.id}`;
    await prisma.pushSubscription.create({ data: { userId: user.id, endpoint, p256dh: "clave", auth: "auth" } });
    await makeDue(nodex.id);
    return { nodex, endpoint };
  }

  const callsTo = (endpoint: string) => vi.mocked(sendPush).mock.calls.filter(([subscription]) => subscription.endpoint === endpoint);

  test("se envía una sola vez", async () => {
    const { nodex, endpoint } = await dueReminderWithSubscription();
    await sendDueReminders();
    await sendDueReminders();
    expect(callsTo(endpoint)).toHaveLength(1);
    expect(callsTo(endpoint)[0]![1]).toMatchObject({ title: "Recordatorio de Nodex", body: "Aviso" });
    const reminder = await prisma.reminder.findUniqueOrThrow({ where: { nodexId: nodex.id } });
    expect(reminder.sentAt).not.toBe(null);
  });

  test("una suscripción caducada se borra", async () => {
    vi.mocked(sendPush).mockResolvedValueOnce("expired");
    const { endpoint } = await dueReminderWithSubscription();
    await sendDueReminders();
    expect(await prisma.pushSubscription.count({ where: { endpoint } })).toBe(0);
  });

  test("no avisa de un Nodex que está en la papelera", async () => {
    const { nodex, endpoint } = await dueReminderWithSubscription();
    await prisma.nodex.update({ where: { id: nodex.id }, data: { deletedAt: new Date() } });
    await sendDueReminders();
    expect(callsTo(endpoint)).toHaveLength(0);
  });
});
