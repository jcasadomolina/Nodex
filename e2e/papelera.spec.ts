import { expect, type Page, test } from "@playwright/test";
import { seedNodex, unique } from "./helpers";

async function deleteFromItsPage(page: Page, id: string) {
  await page.goto(`/nodexs/${id}`);
  await page.getByRole("button", { name: "Más acciones" }).click();
  await page.getByRole("menuitem", { name: "Borrar" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Borrar" }).click();
  await expect(page).toHaveURL(/\/$/);
}

test("borrar, deshacer y restaurar desde la papelera", async ({ page }) => {
  const nodex = await seedNodex(page, unique("Recibo del alquiler"));

  await deleteFromItsPage(page, nodex.id);
  await expect(page.getByRole("button", { name: nodex.title })).toHaveCount(0);
  await page.getByRole("button", { name: "Deshacer" }).click();
  await expect(page.getByRole("button", { name: nodex.title })).toBeVisible();

  await deleteFromItsPage(page, nodex.id);
  await page.goto("/papelera");
  await page.getByRole("button", { name: `Restaurar «${nodex.title}»` }).click();
  await expect(page.getByRole("button", { name: `Restaurar «${nodex.title}»` })).toHaveCount(0);

  await page.goto("/");
  await expect(page.getByRole("button", { name: nodex.title })).toBeVisible();
});
