import assert from "node:assert/strict";
import { test } from "node:test";
import { createNodexSchema } from "../nodexs/nodexs.schemas.js";
import { DEMO_GROUPS, DEMO_NODEXS } from "./demo.data.js";

test("cada Nodex de ejemplo es válido", () => {
  for (const { title, content, url, priority, tags } of DEMO_NODEXS) {
    assert.doesNotThrow(() => createNodexSchema.parse({ type: url ? "link" : "note", title, content, url, priority, tags }), title);
  }
});

test("los grupos citados existen y no se repiten", () => {
  const names = DEMO_GROUPS.map((group) => group.name);
  assert.equal(new Set(names).size, names.length);
  for (const nodex of DEMO_NODEXS) {
    for (const group of nodex.groups) assert.ok(names.includes(group), `${nodex.title} → ${group}`);
  }
});

test("enseña todas las funciones", () => {
  assert.ok(DEMO_NODEXS.filter((n) => n.groups.length === 0).length >= 4);
  assert.ok(DEMO_NODEXS.filter((n) => (n.ageDays ?? 0) >= 30).length >= 3);
  assert.ok(new Set(DEMO_NODEXS.flatMap((n) => (n.task ? [n.task.status] : []))).size >= 3);
  assert.ok(DEMO_NODEXS.some((n) => n.remindInHours !== undefined));
  assert.ok(DEMO_NODEXS.filter((n) => n.readLater && n.url).length >= 2);
});
