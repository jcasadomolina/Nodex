import assert from "node:assert/strict";
import { test } from "node:test";
import { MAX_GROUP_NAME, restoredName } from "./trash.names.js";

test("restoredName añade el sufijo y lo numera", () => {
  assert.equal(restoredName("Cocina", 0), "Cocina");
  assert.equal(restoredName("Cocina", 1), "Cocina (restaurado)");
  assert.equal(restoredName("Cocina", 2), "Cocina (restaurado 2)");
  assert.equal(restoredName("Cocina", 10), "Cocina (restaurado 10)");
});

test("restoredName no acumula sufijos", () => {
  assert.equal(restoredName("Cocina (restaurado)", 2), "Cocina (restaurado 2)");
  assert.equal(restoredName("Cocina (restaurado 3)", 1), "Cocina (restaurado)");
});

test("restoredName no pasa de 80 caracteres", () => {
  const long = "x".repeat(MAX_GROUP_NAME);
  for (const attempt of [1, 2, 100]) {
    const name = restoredName(long, attempt);
    assert.equal(name.length, MAX_GROUP_NAME);
    assert.ok(name.endsWith(attempt === 1 ? " (restaurado)" : ` (restaurado ${attempt})`));
  }
});
