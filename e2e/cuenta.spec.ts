import { expect, test } from "@playwright/test";
import { PASSWORD, register, skipTutorial } from "./helpers";

test.use({ storageState: { cookies: [], origins: [] } });

test("registrarse, cerrar sesión y volver a entrar", async ({ page }) => {
  const { email } = await register(page);
  await skipTutorial(page);

  await page.goto("/");
  await page.getByRole("button", { name: "Ajustes" }).click();
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL(/\/login/);

  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill("contraseña-incorrecta");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("Email o contraseña incorrectos")).toBeVisible();

  await page.getByLabel("Contraseña", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).not.toHaveURL(/\/login/);
});
