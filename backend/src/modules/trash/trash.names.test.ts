import { expect, test } from "vitest";
import { MAX_GROUP_NAME, restoredName } from "./trash.names.js";

test("restoredName añade el sufijo y lo numera", () => {
  expect(restoredName("Cocina", 0)).toBe("Cocina");
  expect(restoredName("Cocina", 1)).toBe("Cocina (restaurado)");
  expect(restoredName("Cocina", 2)).toBe("Cocina (restaurado 2)");
  expect(restoredName("Cocina", 10)).toBe("Cocina (restaurado 10)");
});

test("restoredName no acumula sufijos", () => {
  expect(restoredName("Cocina (restaurado)", 2)).toBe("Cocina (restaurado 2)");
  expect(restoredName("Cocina (restaurado 3)", 1)).toBe("Cocina (restaurado)");
});

test("restoredName no pasa de 80 caracteres", () => {
  const long = "x".repeat(MAX_GROUP_NAME);
  for (const attempt of [1, 2, 100]) {
    const name = restoredName(long, attempt);
    expect(name.length).toBe(MAX_GROUP_NAME);
    expect(name.endsWith(attempt === 1 ? " (restaurado)" : ` (restaurado ${attempt})`)).toBeTruthy();
  }
});
