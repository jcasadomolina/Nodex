import { expect, test } from "@playwright/test";
import { seedNodex, unique } from "./helpers";

test("con la IA desactivada, buscar encuentra por texto", async ({ page }) => {
  const recipe = await seedNodex(page, unique("Receta de lentejas con chorizo"));
  const other = await seedNodex(page, unique("Configurar Git en Windows"));

  await page.goto("/");
  await page.getByRole("searchbox", { name: "Buscar Nodexs" }).fill(recipe.title);
  await expect(page.getByText(recipe.title)).toBeVisible();
  await expect(page.getByText(other.title)).toHaveCount(0);
});
