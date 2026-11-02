// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

class FakeWorker {
  static last: FakeWorker;
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onerror: ((event: { message: string }) => void) | null = null;
  sent: { type: string; id?: number; text?: string }[] = [];
  constructor() {
    FakeWorker.last = this;
  }
  postMessage(message: { type: string; id?: number; text?: string }) {
    this.sent.push(message);
  }
  reply(data: unknown) {
    this.onmessage?.({ data });
  }
  terminate() {}
}

beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
  vi.stubGlobal("Worker", FakeWorker);
});

afterEach(() => vi.unstubAllGlobals());

describe("IA en el dispositivo", () => {
  test("la preferencia empieza sin decidir y se guarda en nodex-ai", async () => {
    const { getPreference, setPreference } = await import("./ai");
    expect(getPreference()).toBe(null);
    setPreference("off");
    expect(localStorage.getItem("nodex-ai")).toBe("off");
    expect(getPreference()).toBe("off");
  });

  test("embed devuelve null mientras la IA está apagada", async () => {
    const { embed } = await import("./ai");
    expect(await embed("hola")).toBe(null);
  });

  test("al cargar pasa por el progreso y calcula vectores cuando está lista", async () => {
    const { embed, enableAi, getAiStatus, getPreference } = await import("./ai");
    const loading = enableAi();
    expect(getPreference()).toBe("on");
    FakeWorker.last.reply({ type: "progress", progress: 40 });
    expect(getAiStatus()).toEqual({ state: "loading", progress: 40 });
    FakeWorker.last.reply({ type: "ready" });
    await loading;
    expect(getAiStatus()).toEqual({ state: "ready" });

    const vector = embed("hola");
    const { id } = FakeWorker.last.sent.at(-1)!;
    FakeWorker.last.reply({ type: "vector", id, embedding: [0.1, 0.2] });
    expect(await vector).toEqual([0.1, 0.2]);
  });

  test("si la descarga falla, vuelve a apagada y avisa", async () => {
    const { enableAi, getAiStatus } = await import("./ai");
    const loading = enableAi();
    FakeWorker.last.reply({ type: "error", message: "sin conexión" });
    await expect(loading).rejects.toThrow("sin conexión");
    expect(getAiStatus()).toEqual({ state: "off" });
  });

  test("si el worker se cae al cargar, vuelve a apagada y se puede reintentar", async () => {
    const { enableAi, getAiStatus } = await import("./ai");
    const loading = enableAi();
    FakeWorker.last.onerror?.({ message: "sin memoria" });
    await expect(loading).rejects.toThrow("sin memoria");
    expect(getAiStatus()).toEqual({ state: "off" });
  });

  test("si el worker se cae con un vector a medias, embed devuelve null", async () => {
    const { embed, enableAi } = await import("./ai");
    const loading = enableAi();
    FakeWorker.last.reply({ type: "ready" });
    await loading;
    const vector = embed("hola");
    FakeWorker.last.onerror?.({ message: "sin memoria" });
    expect(await vector).toBe(null);
  });
});
