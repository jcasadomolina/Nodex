import { expect, test } from "vitest";
import { createNodexSchema, PRIORITIES, priorityToName, priorityToNumber, updateNodexSchema } from "./nodexs.schemas.js";

test("las prioridades van y vuelven", () => {
  for (const priority of PRIORITIES) {
    expect(priorityToName(priorityToNumber(priority))).toBe(priority);
  }
  expect(priorityToName(null)).toBe(null);
});

test("las etiquetas se normalizan", () => {
  const { tags } = updateNodexSchema.parse({ tags: ["#Hola Mundo", "hola-mundo", "  JS  "] });
  expect(tags).toEqual(["hola-mundo", "js"]);

  const [long] = updateNodexSchema.parse({ tags: ["a".repeat(40)] }).tags!;
  expect(long).toHaveLength(30);
});

test("no se aceptan más de 10 etiquetas", () => {
  const result = updateNodexSchema.safeParse({ tags: Array.from({ length: 11 }, (_, i) => `t${i}`) });
  expect(result.success).toBe(false);
  expect(result.error?.issues[0]?.message).toBe("Un Nodex puede tener como máximo 10 etiquetas");
});

test("un enlace necesita URL", () => {
  const result = createNodexSchema.safeParse({ type: "link", title: "x" });
  expect(result.error?.issues[0]?.path).toEqual(["url"]);
});

test("la URL debe ser http o https", () => {
  const result = createNodexSchema.safeParse({ type: "link", title: "x", url: "ftp://ejemplo.com" });
  expect(result.success).toBe(false);
});
