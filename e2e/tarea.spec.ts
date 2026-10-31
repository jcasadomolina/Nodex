import { expect, test } from "@playwright/test";
import { seedNodex, unique } from "./helpers";

test("convertir un Nodex en tarea y moverla de columna con el teclado", async ({ page }) => {
  const nodex = await seedNodex(page, unique("Preparar entrevista"));

  await page.goto(`/nodexs/${nodex.id}`);
  await page.getByRole("switch", { name: "No es una tarea" }).click();
  await expect(page.getByRole("switch", { name: "Es una tarea" })).toBeChecked();

  await expect.poll(async () => (await page.request.get(`/api/nodexs/${nodex.id}`).then((r) => r.json())).nodex.task?.status).toBe("todo");
  await page.goto("/tareas");
  const todo = page.getByRole("region", { name: /Pendiente/ });
  const doing = page.getByRole("region", { name: /En curso/ });
  const card = page.getByRole("button", { name: nodex.title });
  await expect(todo.getByRole("button", { name: nodex.title })).toBeVisible();

  const announcer = page.getByRole("status");
  await card.focus();
  await page.keyboard.press("Space");
  await expect(announcer).toContainText(/Has cogido la tarea|sobre Pendiente/);
  await page.keyboard.press("ArrowRight");
  await expect(announcer).toContainText(/sobre En curso/);
  await page.keyboard.press("Space");
  await expect(announcer).toContainText("soltada en");

  await expect(doing.getByRole("button", { name: nodex.title })).toBeVisible();
  await expect.poll(async () => (await page.request.get(`/api/nodexs/${nodex.id}`).then((r) => r.json())).nodex.task?.status).toBe("doing");
  await page.reload();
  await expect(page.getByRole("region", { name: /En curso/ }).getByRole("button", { name: nodex.title })).toBeVisible();
});
