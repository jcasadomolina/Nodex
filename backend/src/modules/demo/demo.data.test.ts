import { expect, test } from "vitest";
import { nodexText } from "../ai/vectors.js";
import { createNodexSchema } from "../nodexs/nodexs.schemas.js";
import DEMO_EMBEDDINGS from "./demo.embeddings.json" with { type: "json" };
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

test("los vectores precalculados están al día (si falla: npm run demo:embeddings)", () => {
  expect(DEMO_EMBEDDINGS).toHaveLength(DEMO_NODEXS.length);
  DEMO_NODEXS.forEach(({ title, content, url }, i) => {
    expect(DEMO_EMBEDDINGS[i]!.text, title).toBe(nodexText({ title, content: content ?? null, url: url ?? null }));
    expect(DEMO_EMBEDDINGS[i]!.embedding).toHaveLength(384);
  });
});
