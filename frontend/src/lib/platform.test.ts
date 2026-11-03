// @vitest-environment jsdom
import { afterEach, expect, test } from "vitest";
import { isDesktopApp } from "./platform";

afterEach(() => {
  delete (window as { nodexDesktop?: boolean }).nodexDesktop;
});

test("detecta la app de escritorio por la marca que pone al arrancar", () => {
  (window as { nodexDesktop?: boolean }).nodexDesktop = true;
  expect(isDesktopApp()).toBe(true);
});

test("en un navegador normal no es la app de escritorio", () => {
  expect(isDesktopApp()).toBe(false);
});
