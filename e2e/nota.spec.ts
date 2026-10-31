import { expect, test } from "@playwright/test";
import { unique } from "./helpers";

test("crear una nota con prioridad y etiqueta, y escribir su contenido en Markdown", async ({ page }) => {
  const title = unique("Plan de viaje");
  await page.goto("/");
  await page.getByRole("button", { name: "Crear Nodex" }).click();

  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Título").fill(title);
  await dialog.getByText("Más opciones").click();
  await dialog.getByRole("button", { name: "Alta", exact: true }).click();
  await dialog.getByLabel("Etiquetas").fill("viajes");
  await dialog.getByLabel("Etiquetas").press("Enter");
  await dialog.getByRole("button", { name: "Crear", exact: true }).click();

  await expect(page).toHaveURL(/\/nodexs\//);
  await expect(page.getByRole("heading", { name: title, level: 1 })).toBeVisible();
  await expect(page.getByRole("button", { name: "Alta", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("#viajes").first()).toBeVisible();

  const content = page.getByRole("region", { name: "Contenido" });
  const markdown = page.getByRole("textbox", { name: "Contenido en Markdown" });
  if (!(await markdown.isVisible())) await content.getByRole("button", { name: "Editar" }).click();
  await markdown.fill("# Qué llevar\n\n- [ ] Pasaporte");
  await content.getByRole("button", { name: "Listo" }).click();

  await expect(content.getByRole("heading", { name: "Qué llevar" })).toBeVisible();
  await expect(content.getByRole("checkbox")).toBeVisible();

  const id = page.url().split("/nodexs/")[1];
  await expect.poll(async () => (await (await page.request.get(`/api/nodexs/${id}`)).json()).nodex.content).toContain("Qué llevar");
  await page.reload();
  await expect(page.getByRole("region", { name: "Contenido" }).getByRole("heading", { name: "Qué llevar" })).toBeVisible();
});
