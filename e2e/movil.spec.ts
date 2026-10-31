import { expect, test } from "@playwright/test";
import { unique } from "./helpers";

test("en el móvil se navega con la barra inferior y se crea un Nodex", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Navegación principal" });
  await expect(nav).toBeVisible();

  await nav.getByRole("link", { name: "Tareas" }).click();
  await expect(page).toHaveURL(/\/tareas/);
  await nav.getByRole("link", { name: "Panel" }).click();
  await expect(page).toHaveURL(/\/$/);

  const title = unique("Idea desde el móvil");
  await page.getByRole("button", { name: "Crear Nodex" }).click();
  await page.getByRole("dialog").getByLabel("Título").fill(title);
  await page.getByRole("dialog").getByRole("button", { name: "Crear", exact: true }).click();
  await expect(page.getByRole("heading", { name: title, level: 1 })).toBeVisible();
});
