// @vitest-environment jsdom
import { beforeEach, describe, expect, test, vi } from "vitest";

type Tabs = typeof import("./tabs");

let tabs: Tabs;

async function freshTabs(saved?: unknown) {
  localStorage.clear();
  if (saved !== undefined) localStorage.setItem("nodex-tabs", typeof saved === "string" ? saved : JSON.stringify(saved));
  vi.resetModules();
  tabs = await import("./tabs");
}

function state() {
  return JSON.parse(localStorage.getItem("nodex-tabs")!);
}

beforeEach(() => freshTabs());

describe("pestañas", () => {
  test("abrir un Nodex sustituye la pestaña activa", () => {
    tabs.showInTabs("a");
    tabs.showInTabs("b");
    expect(state().left).toEqual({ tabs: ["b"], active: "b" });
  });

  test("pedir una pestaña nueva la añade", () => {
    tabs.showInTabs("a");
    tabs.requestNewTab("b");
    tabs.showInTabs("b");
    expect(state().left).toEqual({ tabs: ["a", "b"], active: "b" });
  });

  test("abrir uno que ya está abierto solo lo activa", () => {
    tabs.showInTabs("a");
    tabs.requestNewTab("b");
    tabs.showInTabs("b");
    tabs.showInTabs("a");
    expect(state().left).toEqual({ tabs: ["a", "b"], active: "a" });
  });

  test("cerrar la activa activa la de al lado", () => {
    for (const id of ["a", "b", "c"]) {
      tabs.requestNewTab(id);
      tabs.showInTabs(id);
    }
    expect(tabs.closeTab("left", "c")).toBe("b");
    expect(tabs.closeTab("left", "a")).toBe("b");
    expect(state().left).toEqual({ tabs: ["b"], active: "b" });
  });

  test("como mucho hay 20 pestañas y se cierra la más antigua", () => {
    for (let i = 0; i < 21; i++) {
      tabs.requestNewTab(`n${i}`);
      tabs.showInTabs(`n${i}`);
    }
    expect(state().left.tabs).toHaveLength(20);
    expect(state().left.tabs[0]).toBe("n1");
  });
});

describe("dos paneles", () => {
  test("abrir a la derecha crea el panel derecho", () => {
    tabs.openRight("a");
    expect(state().right).toEqual({ tabs: ["a"], active: "a" });
  });

  test("cerrar la última pestaña de la derecha quita el panel", () => {
    tabs.openRight("a");
    tabs.closeTab("right", "a");
    expect(state().right).toBe(null);
  });

  test("la división queda entre 25 y 75", () => {
    expect(tabs.clampSplit(10)).toBe(25);
    expect(tabs.clampSplit(90)).toBe(75);
    expect(tabs.clampSplit(Number.NaN)).toBe(50);
    tabs.setSplit(60);
    expect(state().split).toBe(60);
  });
});

describe("lo guardado", () => {
  test("se recupera al volver", async () => {
    await freshTabs({ left: { tabs: ["a", "b"], active: "b" }, right: null, split: 40 });
    tabs.openRight("c");
    expect(state()).toEqual({ left: { tabs: ["a", "b"], active: "b" }, right: { tabs: ["c"], active: "c" }, split: 40 });
  });

  test("si está corrupto se empieza de cero", async () => {
    await freshTabs("{esto no es json");
    tabs.showInTabs("a");
    expect(state().left).toEqual({ tabs: ["a"], active: "a" });
  });

  test("se descartan valores raros", async () => {
    await freshTabs({ left: { tabs: ["a", 3, null], active: "z" }, split: 999 });
    tabs.openRight("b");
    expect(state()).toMatchObject({ left: { tabs: ["a"], active: null }, split: 75 });
  });
});
