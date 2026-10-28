import assert from "node:assert/strict";
import { test } from "node:test";
import { boostPairs, clusterByNeighbors, suggestName } from "./new-groups.js";

const pair = (a: string, b: string, similarity = 0.8) => ({ a, b, similarity });

test("clusterByNeighbors separa dos estrellas", () => {
  const ids = ["a", "b", "c", "d", "x", "y", "z"];
  const pairs = [pair("a", "b"), pair("a", "c"), pair("a", "d"), pair("x", "y"), pair("x", "z")];
  const clusters = clusterByNeighbors(ids, pairs).map((c) => [...c].sort());
  assert.deepEqual(clusters, [
    ["a", "b", "c", "d"],
    ["x", "y", "z"],
  ]);
});

test("clusterByNeighbors no une una cadena", () => {
  const ids = ["a", "b", "c", "d", "e"];
  const pairs = [pair("a", "b"), pair("b", "c"), pair("c", "d"), pair("d", "e")];
  const clusters = clusterByNeighbors(ids, pairs);
  assert.ok(clusters.every((c) => c.length <= 3));
  assert.ok(clusters.every((c) => c.length >= 3));
});

test("clusterByNeighbors descarta grupos de menos de 3", () => {
  assert.deepEqual(clusterByNeighbors(["a", "b", "c"], [pair("a", "b")]), []);
});

test("suggestName usa la etiqueta compartida", () => {
  const nodexs = [
    { title: "Lentejas", tags: ["cocina"] },
    { title: "Paella", tags: ["cocina", "arroz"] },
    { title: "Tortilla", tags: [] },
  ];
  assert.equal(suggestName(nodexs, new Set()), "Cocina");
});

test("suggestName usa la palabra repetida sin tildes ni palabras vacías", () => {
  const nodexs = [
    { title: "Receta de la paella", tags: [] },
    { title: "Mejor RECETA de lentejas", tags: [] },
    { title: "Recéta del cocido", tags: [] },
  ];
  assert.equal(suggestName(nodexs, new Set()), "Receta");
});

test("suggestName evita nombres ocupados", () => {
  const nodexs = [
    { title: "Viaje a Roma", tags: [] },
    { title: "Viaje a Japón con hotel", tags: [] },
    { title: "Hotel en Lisboa, viaje", tags: [] },
  ];
  assert.equal(suggestName(nodexs, new Set(["viaje"])), "Hotel");
});

test("suggestName usa el nombre por defecto", () => {
  const nodexs = [
    { title: "Uno", tags: [] },
    { title: "Dos", tags: [] },
    { title: "Tres", tags: [] },
  ];
  assert.equal(suggestName(nodexs, new Set()), "Grupo sugerido");
  assert.equal(suggestName(nodexs, new Set(["grupo sugerido"])), "Grupo sugerido 2");
});

test("boostPairs suma el bonus a las parejas con una palabra o etiqueta en común", () => {
  const nodexs = new Map([
    ["a", { title: "Viaje a Roma", tags: [] }],
    ["b", { title: "Hotel para el viaje", tags: [] }],
    ["c", { title: "Comprar bombillas", tags: [] }],
    ["d", { title: "Lentejas", tags: ["cocina"] }],
    ["e", { title: "Paella", tags: ["Cocina"] }],
  ]);
  const result = boostPairs(nodexs, [pair("a", "b", 0.31), pair("c", "d", 0.54), pair("d", "e", 0.3)]);
  assert.deepEqual(
    result.map((p) => [p.a, p.b]),
    [
      ["a", "b"],
      ["d", "e"],
    ],
  );
});

test("suggestName cuenta las etiquetas sin distinguir mayúsculas e ignora números", () => {
  const nodexs = [
    { title: "Plan 2026", tags: ["Cocina"] },
    { title: "Plan 2026 bis", tags: ["cocina"] },
    { title: "Otra cosa 2026", tags: [] },
  ];
  assert.equal(suggestName(nodexs, new Set()), "Cocina");
  assert.equal(suggestName(nodexs, new Set(["cocina"])), "Plan");
});
