import { describe, expect, test } from "vitest";
import { domainOf, formatDateTime, fromDateInput, fromDateTimeInput, looksLikeUrl, toDateInput, toDateTimeInput } from "./format";

describe("fechas", () => {
  test("el día del campo de fecha va y vuelve", () => {
    expect(toDateInput(fromDateInput("2026-11-05"))).toBe("2026-11-05");
  });

  test("la fecha y hora del campo va y vuelve", () => {
    expect(toDateTimeInput(fromDateTimeInput("2026-11-05T09:30"))).toBe("2026-11-05T09:30");
  });

  test("se muestra en español", () => {
    expect(formatDateTime(fromDateTimeInput("2026-11-05T09:30"))).toMatch(/5 nov.*09:30/);
  });
});

describe("enlaces", () => {
  test.each([
    ["https://www.developer.mozilla.org/es/docs", "developer.mozilla.org"],
    ["https://css-tricks.com/x", "css-tricks.com"],
    ["no es una url", "no es una url"],
  ])("domainOf(%s) da %s", (url, domain) => {
    expect(domainOf(url)).toBe(domain);
  });

  test.each([
    ["https://ejemplo.com", true],
    ["http://ejemplo.com/a?b=1", true],
    ["ejemplo.com", false],
    ["ftp://ejemplo.com", false],
    ["hola", false],
  ])("looksLikeUrl(%s) da %s", (text, expected) => {
    expect(looksLikeUrl(text)).toBe(expected);
  });
});
