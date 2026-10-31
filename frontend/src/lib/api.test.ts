import { afterEach, describe, expect, test, vi } from "vitest";
import { api, ApiError } from "./api";

function respond(status: number, body?: unknown) {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(body === undefined ? null : JSON.stringify(body), { status })));
}

afterEach(() => vi.unstubAllGlobals());

describe("llamadas a la API", () => {
  test("pide /api y manda el cuerpo como JSON", async () => {
    respond(200, { ok: true });
    await api("/nodexs", { method: "POST", body: { title: "x" } });
    expect(fetch).toHaveBeenCalledWith("/api/nodexs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "x" }),
    });
  });

  test("un formulario se manda tal cual, sin cabecera JSON", async () => {
    respond(200, {});
    const form = new FormData();
    await api("/me/avatar", { method: "PUT", body: form });
    expect(fetch).toHaveBeenCalledWith("/api/me/avatar", { method: "PUT", headers: undefined, body: form });
  });

  test("un 204 devuelve undefined", async () => {
    respond(204);
    expect(await api("/nodexs/1", { method: "DELETE" })).toBe(undefined);
  });

  test("un error trae el código, el mensaje y los campos", async () => {
    respond(400, { error: "Datos no válidos", details: { title: ["El título es obligatorio"] } });
    const error = await api("/nodexs", { method: "POST", body: {} }).catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 400, message: "Datos no válidos", fields: { title: ["El título es obligatorio"] } });
  });

  test("un error sin JSON da un mensaje genérico", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("<html>caído</html>", { status: 502 })));
    const error = await api("/nodexs").catch((e) => e);
    expect(error).toMatchObject({ status: 502, message: "Error inesperado del servidor" });
  });

  test("sin red da status 0", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("Failed to fetch"))));
    const error = await api("/nodexs").catch((e) => e);
    expect(error).toMatchObject({ status: 0, message: "No se ha podido conectar con el servidor" });
  });
});
