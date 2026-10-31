import { expect, test } from "vitest";
import { createNodexSchema } from "../nodexs/nodexs.schemas.js";
import { DEMO_GROUPS, DEMO_NODEXS } from "./demo.data.js";

test("cada Nodex de ejemplo es válido", () => {
  for (const { title, content, url, priority, tags } of DEMO_NODEXS) {
    expect(() => createNodexSchema.parse({ type: url ? "link" : "note", title, content, url, priority, tags }), title).not.toThrow();
  }
});

test("los grupos citados existen y no se repiten", () => {
  const names = DEMO_GROUPS.map((group) => group.name);
  expect(new Set(names).size).toBe(names.length);
  for (const nodex of DEMO_NODEXS) {
    for (const group of nodex.groups) expect(names.includes(group), `${nodex.title} → ${group}`).toBeTruthy();
  }
});

test("enseña todas las funciones", () => {
  expect(DEMO_NODEXS.filter((n) => n.groups.length === 0).length).toBeGreaterThanOrEqual(4);
  expect(DEMO_NODEXS.filter((n) => (n.ageDays ?? 0) >= 30).length).toBeGreaterThanOrEqual(3);
  expect(new Set(DEMO_NODEXS.flatMap((n) => (n.task ? [n.task.status] : []))).size).toBeGreaterThanOrEqual(3);
  expect(DEMO_NODEXS.some((n) => n.remindInHours !== undefined)).toBeTruthy();
  expect(DEMO_NODEXS.filter((n) => n.readLater && n.url).length).toBeGreaterThanOrEqual(2);
});
