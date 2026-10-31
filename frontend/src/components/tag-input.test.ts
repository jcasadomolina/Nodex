import { expect, test } from "vitest";
import { normalizeTag } from "./tag-input";

test.each([
  ["  #Hola Mundo ", "hola-mundo"],
  ["##JS", "js"],
  ["dos   espacios", "dos-espacios"],
  ["a".repeat(40), "a".repeat(30)],
])("normalizeTag(«%s») da «%s»", (name, tag) => {
  expect(normalizeTag(name)).toBe(tag);
});
