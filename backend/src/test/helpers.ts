import { randomUUID } from "node:crypto";
import request from "supertest";
import { app } from "../app.js";
import { embed } from "../lib/embeddings.js";

export type Agent = ReturnType<typeof request.agent>;

export const PASSWORD = "contraseña-de-prueba";

export function anonymous() {
  return request(app);
}

export async function newUser() {
  const agent = request.agent(app);
  const email = `test-${randomUUID()}@ejemplo.com`;
  const res = await agent.post("/api/auth/register").send({ name: "Test", email, password: PASSWORD });
  if (res.status !== 201) throw new Error(`No se pudo registrar el usuario de prueba: ${res.status} ${JSON.stringify(res.body)}`);
  return { agent, user: res.body.user as { id: string; email: string; name: string } };
}

export async function createNodex(agent: Agent, data: Record<string, unknown> = {}) {
  const body: Record<string, unknown> = { title: "Nodex de prueba", groupIds: [], ...data };
  const res = await agent.post("/api/nodexs").send({ type: body.url ? "link" : "note", ...body });
  if (res.status !== 201) throw new Error(`No se pudo crear el Nodex: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.nodex as { id: string; title: string; type: string; groupIds: string[] };
}

export async function createGroup(agent: Agent, name = `Grupo ${randomUUID().slice(0, 8)}`) {
  const res = await agent.post("/api/groups").send({ name });
  if (res.status !== 201) throw new Error(`No se pudo crear el grupo: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.group as { id: string; name: string };
}

export function warmUpAi() {
  return embed("calentar el modelo");
}

export async function embedPending(agent: Agent) {
  for (;;) {
    const { nodexs } = (await agent.get("/api/nodexs/pending-embeddings")).body as { nodexs: { id: string; text: string }[] };
    if (!nodexs.length) return;
    for (const { id, text } of nodexs) {
      const res = await agent.put(`/api/nodexs/${id}/embedding`).send({ text, embedding: await embed(text) });
      if (res.status !== 200) throw new Error(`No se pudo guardar el vector: ${res.status} ${JSON.stringify(res.body)}`);
    }
  }
}
