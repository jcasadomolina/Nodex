// @vitest-environment jsdom
import { beforeEach, describe, expect, test } from "vitest";
import { DEFAULT_SETTINGS, loadSettings, matchesRule, saveSettings } from "./graph-settings";
import type { Nodex } from "./types";

const nodex = {
  title: "Receta de lentejas",
  content: "Con chorizo",
  tags: ["cocina"],
  priority: "high",
  type: "note",
} as Nodex;

describe("reglas de color", () => {
  test.each([
    ["lentejas", true],
    ["CHORIZO", true],
    ["paella", false],
    ["", false],
    ["grupo:Recetas", true],
    ["grupo:viajes", false],
    ["etiqueta:#cocina", true],
    ["etiqueta:viajes", false],
    ["prioridad:alta", true],
    ["prioridad:baja", false],
    ["tipo:nota", true],
    ["tipo:enlace", false],
  ])("«%s» da %s", (query, expected) => {
    expect(matchesRule(query, nodex, ["Recetas"])).toBe(expected);
  });
});

describe("ajustes guardados", () => {
  beforeEach(() => localStorage.clear());

  test("sin nada guardado da los de por defecto", () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  test("guarda y recupera", () => {
    saveSettings({ ...DEFAULT_SETTINGS, arrows: true, nodeSize: 2 });
    expect(loadSettings()).toEqual({ ...DEFAULT_SETTINGS, arrows: true, nodeSize: 2 });
  });

  test("completa con los de por defecto lo que falte", () => {
    localStorage.setItem("nodex-graph", JSON.stringify({ arrows: true }));
    expect(loadSettings()).toEqual({ ...DEFAULT_SETTINGS, arrows: true });
  });

  test("si están corruptos da los de por defecto", () => {
    localStorage.setItem("nodex-graph", "{roto");
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });
});
