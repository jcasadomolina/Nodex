import { expect, test } from "@playwright/test";
import { seedNodex, unique } from "./helpers";

test("buscar por significado encuentra el Nodex aunque no comparta palabras", async ({ page }) => {
  const recipe = await seedNodex(page, unique("Receta de lentejas con chorizo"), { content: "Cocer las lentejas con chorizo y verdura" });
  const other = await seedNodex(page, unique("Configurar Git en Windows"));

  await page.goto("/");
  const search = page.getByRole("searchbox", { name: "Buscar Nodexs" });
  await expect(async () => {
    await search.fill("");
    await search.fill("guiso de legumbres");
    await expect(page.getByText(recipe.title)).toBeVisible({ timeout: 3_000 });
  }).toPass({ timeout: 60_000 });
  await expect(page.getByText(other.title)).toHaveCount(0);
});
