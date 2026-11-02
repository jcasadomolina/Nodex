import { randomUUID } from "node:crypto";
import { expect, type Page } from "@playwright/test";

export const PASSWORD = "contraseña-de-prueba";

export const AI_OFF = {
  cookies: [],
  origins: [{ origin: "http://localhost:3100", localStorage: [{ name: "nodex-ai", value: "off" }] }],
};

export const unique = (text: string) => `${text} ${randomUUID().slice(0, 6)}`;

export async function register(page: Page) {
  const email = `e2e-${randomUUID()}@ejemplo.com`;
  await page.goto("/registro");
  await page.evaluate(() => localStorage.setItem("nodex-ai", "off"));
  await page.getByLabel("Nombre").fill("Ana");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Registrarme" }).click();
  await expect(page).toHaveURL(/\/bienvenida/);
  return { email };
}

export async function seedNodex(page: Page, title: string, data: Record<string, unknown> = {}) {
  const res = await page.request.post("/api/nodexs", { data: { type: "note", title, groupIds: [], ...data } });
  expect(res.status()).toBe(201);
  return (await res.json()).nodex as { id: string; title: string };
}

export async function skipTutorial(page: Page) {
  const res = await page.request.put("/api/me/tutorial", { data: { version: 1000 } });
  expect(res.ok()).toBeTruthy();
}
