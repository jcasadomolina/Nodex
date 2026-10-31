import { expect, test } from "@playwright/test";
import { seedNodex, unique } from "./helpers";

test("crear un grupo, meter un Nodex y filtrar el panel por él", async ({ page }) => {
  const group = unique("Viajes");
  const inside = await seedNodex(page, unique("Hotel en Oporto"));
  const outside = await seedNodex(page, unique("Comprar pan"));

  await page.goto("/");
  await page.getByRole("button", { name: "Grupo", exact: true }).click();
  await page.getByLabel("Nombre del grupo").fill(group);
  await page.getByLabel("Nombre del grupo").press("Enter");
  await expect(page.getByRole("button", { name: new RegExp(`^${group}`) })).toBeVisible();

  await page.goto(`/nodexs/${inside.id}`);
  await page.getByRole("button", { name: group }).click();
  await expect(page.getByRole("button", { name: group })).toHaveAttribute("aria-pressed", "true");

  await page.goto("/");
  await page.getByRole("button", { name: new RegExp(`^${group}`) }).click();
  await expect(page.getByRole("button", { name: inside.title })).toBeVisible();
  await expect(page.getByRole("button", { name: outside.title })).toHaveCount(0);
});
