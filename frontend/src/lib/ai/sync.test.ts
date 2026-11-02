import { beforeEach, describe, expect, test, vi } from "vitest";
import { api, ApiError } from "../api";
import { aiReady, embed } from "./ai";
import { syncPending } from "./sync";

vi.mock("../api", async (importOriginal) => ({ ...(await importOriginal<typeof import("../api")>()), api: vi.fn() }));
vi.mock("./ai", () => ({ aiReady: vi.fn(), embed: vi.fn() }));

const apiMock = vi.mocked(api);

function serve(pages: { id: string; text: string }[][], put: (id: string) => unknown = () => ({ duplicates: [] })) {
  const left = [...pages];
  apiMock.mockImplementation(async (path: string, options?: { method?: string }) => {
    if (path === "/nodexs/pending-embeddings") return { nodexs: left.shift() ?? [] };
    if (options?.method === "PUT") return put(path.split("/")[2]!);
    throw new Error(`Llamada inesperada: ${path}`);
  });
}

const puts = () => apiMock.mock.calls.filter(([, options]) => options?.method === "PUT");

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(aiReady).mockReturnValue(true);
  vi.mocked(embed).mockImplementation(async (text) => [text.length]);
});

describe("sincronizar vectores pendientes", () => {
  test("manda cada pendiente con su texto y devuelve los duplicados", async () => {
    serve([[{ id: "a", text: "uno" }, { id: "b", text: "dos" }]], (id) => ({ duplicates: id === "a" ? [{ id: "x" }] : [] }));
    const duplicates = await syncPending();
    expect(apiMock).toHaveBeenCalledWith("/nodexs/a/embedding", { method: "PUT", body: { text: "uno", embedding: [3] } });
    expect(duplicates.get("a")).toEqual([{ id: "x" }]);
    expect(duplicates.get("b")).toEqual([]);
  });

  test("un 409 se ignora y sigue con el resto", async () => {
    serve([[{ id: "a", text: "uno" }, { id: "b", text: "dos" }], [{ id: "a", text: "uno" }]], (id) => {
      if (id === "a") throw new ApiError(409, "El Nodex ha cambiado");
      return { duplicates: [] };
    });
    const duplicates = await syncPending();
    expect(duplicates.has("b")).toBe(true);
    expect(puts()).toHaveLength(2);
  });

  test("pide páginas hasta vaciar la lista", async () => {
    const first = Array.from({ length: 50 }, (_, i) => ({ id: `n${i}`, text: "t" }));
    serve([first, [{ id: "n50", text: "t" }]]);
    await syncPending();
    expect(puts()).toHaveLength(51);
  });

  test("sin la IA lista no llama a la API", async () => {
    vi.mocked(aiReady).mockReturnValue(false);
    serve([[{ id: "a", text: "uno" }]]);
    expect((await syncPending()).size).toBe(0);
    expect(apiMock).not.toHaveBeenCalled();
  });

  test("dos sincronizaciones seguidas no mandan el mismo Nodex a la vez", async () => {
    let pending = [{ id: "a", text: "uno" }];
    apiMock.mockImplementation(async (path: string, options?: { method?: string }) => {
      if (path === "/nodexs/pending-embeddings") return { nodexs: pending };
      if (options?.method === "PUT") {
        await new Promise((resolve) => setTimeout(resolve, 10));
        pending = [];
        return { duplicates: [] };
      }
    });
    await Promise.all([syncPending(), syncPending()]);
    expect(puts()).toHaveLength(1);
  });

  test("un Nodex cuyo vector falla no bloquea a los demás", async () => {
    vi.mocked(embed).mockImplementation(async (text) => (text === "malo" ? null : [1]));
    serve([[{ id: "a", text: "malo" }, { id: "b", text: "bueno" }]]);
    const duplicates = await syncPending();
    expect(duplicates.has("b")).toBe(true);
    expect(puts()).toHaveLength(1);
  });
});
