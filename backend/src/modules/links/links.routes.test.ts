import { beforeEach, describe, expect, test, vi } from "vitest";
import { safeFetch } from "../../lib/safe-fetch.js";
import { prisma } from "../../lib/prisma.js";
import { anonymous, createNodex, newUser } from "../../test/helpers.js";
import { checkStaleLinks } from "./links.worker.js";

vi.mock("./links.service.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./links.service.js")>()),
  refreshPreviewInBackground: vi.fn(),
}));

vi.mock("../../lib/safe-fetch.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../lib/safe-fetch.js")>()),
  safeFetch: vi.fn(),
}));

const PAGE = `<html><head><title>Guía de Flexbox</title><meta name="description" content="Todo sobre Flexbox"></head><body><p>${"palabra ".repeat(400)}</p></body></html>`;

function answer(status: number, body: string | null = null) {
  vi.mocked(safeFetch).mockResolvedValue({ status, contentType: "text/html", body, finalUrl: "https://ejemplo.com/flexbox" });
}

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json({ archived_snapshots: { closest: { available: true, url: "http://web.archive.org/web/2020/https://ejemplo.com/flexbox" } } })),
  );
});

describe("vista previa de enlaces", () => {
  test("sin sesión da 401", async () => {
    expect((await anonymous().get("/api/links/broken")).status).toBe(401);
  });

  test("comprobar un enlace guarda título, descripción y minutos de lectura", async () => {
    answer(200, PAGE);
    const { agent } = await newUser();
    const nodex = await createNodex(agent, { url: "https://ejemplo.com/flexbox" });
    const res = await agent.post(`/api/links/${nodex.id}/refresh`);
    expect(res.status).toBe(200);
    expect(res.body.preview).toMatchObject({ status: "ok", title: "Guía de Flexbox", description: "Todo sobre Flexbox", readingMinutes: 2 });
  });

  test("un enlace que da 404 queda roto, con la copia de archive.org", async () => {
    answer(404);
    const { agent } = await newUser();
    const nodex = await createNodex(agent, { url: "https://ejemplo.com/flexbox" });
    const res = await agent.post(`/api/links/${nodex.id}/refresh`);
    expect(res.body.preview).toMatchObject({ status: "broken", archiveUrl: "https://web.archive.org/web/2020/https://ejemplo.com/flexbox" });
    const broken = await agent.get("/api/links/broken");
    expect(broken.body.links.map((l: { nodex: { id: string } }) => l.nodex.id)).toEqual([nodex.id]);
  });

  test("una nota no se puede comprobar", async () => {
    const { agent } = await newUser();
    const nodex = await createNodex(agent);
    expect((await agent.post(`/api/links/${nodex.id}/refresh`)).status).toBe(404);
  });

  test("comprobar más de 10 veces por minuto da 429", async () => {
    answer(200, PAGE);
    const { agent } = await newUser();
    const nodex = await createNodex(agent, { url: "https://ejemplo.com/flexbox" });
    for (let i = 0; i < 10; i++) await agent.post(`/api/links/${nodex.id}/refresh`);
    expect((await agent.post(`/api/links/${nodex.id}/refresh`)).status).toBe(429);
  });

  test("otro usuario no puede comprobar ni ver los enlaces rotos ajenos", async () => {
    answer(404);
    const { agent: a } = await newUser();
    const { agent: b } = await newUser();
    const nodex = await createNodex(a, { url: "https://ejemplo.com/flexbox" });
    await a.post(`/api/links/${nodex.id}/refresh`);
    expect((await b.post(`/api/links/${nodex.id}/refresh`)).status).toBe(404);
    expect((await b.get("/api/links/broken")).body.links).toEqual([]);
  });
});

describe("revisión periódica de enlaces", () => {
  test("vuelve a comprobar los enlaces revisados hace más de 7 días", async () => {
    answer(200, PAGE);
    const { agent } = await newUser();
    const nodex = await createNodex(agent, { url: "https://ejemplo.com/flexbox" });
    await agent.post(`/api/links/${nodex.id}/refresh`);
    const old = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
    await prisma.linkPreview.update({ where: { nodexId: nodex.id }, data: { lastCheckedAt: old } });

    answer(404);
    while ((await checkStaleLinks()) > 0) {
      const preview = await prisma.linkPreview.findUniqueOrThrow({ where: { nodexId: nodex.id } });
      if (preview.lastCheckedAt! > old) break;
    }
    const preview = await prisma.linkPreview.findUniqueOrThrow({ where: { nodexId: nodex.id } });
    expect(preview.status).toBe("broken");
  });
});
