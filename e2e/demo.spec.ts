import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { PASSWORD } from "./helpers";

test.use({ storageState: { cookies: [], origins: [] } });

test.setTimeout(240_000);

test("probar sin registrarse, aceptar una sugerencia de la IA y crear la cuenta", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Probar sin registrarse" }).click();
  await expect(page).toHaveURL(/\/bienvenida/, { timeout: 150_000 });

  const enter = page.getByRole("button", { name: "Entrar a Nodex" });
  await expect(async () => {
    if (!(await enter.isVisible())) await page.getByRole("button", { name: "Siguiente" }).click();
    await expect(enter).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 30_000 });
  await expect(async () => {
    await enter.click({ timeout: 2_000 });
    await expect(page).not.toHaveURL(/\/bienvenida/, { timeout: 2_000 });
  }).toPass({ timeout: 30_000 });
  await page.getByRole("button", { name: "Saltar tutorial" }).click();
  await expect(page.getByText(/Estás en la demo/)).toBeVisible();

  const suggestions = page.getByRole("button", { name: /sugerencias? de la IA/ });
  const before = Number((await suggestions.getAttribute("aria-label"))!.match(/\d+/)![0]);
  await suggestions.click();
  await page.getByRole("button", { name: /^Añadir / }).first().click();
  await expect(suggestions).toHaveAttribute("aria-label", new RegExp(`^${before - 1} `));

  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Crear cuenta" }).first().click();
  const dialog = page.getByRole("dialog", { name: "Crea tu cuenta" });
  await dialog.getByLabel("Nombre").fill("Ana");
  await dialog.getByLabel("Correo electrónico").fill(`e2e-demo-${randomUUID()}@ejemplo.com`);
  await dialog.getByLabel("Contraseña").fill(PASSWORD);
  await dialog.getByRole("button", { name: "Crear cuenta" }).click();

  await expect(page.getByText("Cuenta creada. Tus Nodexs se quedan")).toBeVisible();
  await expect(page.getByText(/Estás en la demo/)).toHaveCount(0);
});
