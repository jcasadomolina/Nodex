import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { PASSWORD, skipTutorial } from "./helpers";

test.use({ storageState: { cookies: [], origins: [] } });

test("pregunta antes de descargar la IA y recuerda «Ahora no»", async ({ page }) => {
  const res = await page.request.post("/api/auth/register", {
    data: { name: "Ana", email: `e2e-ia-${randomUUID()}@ejemplo.com`, password: PASSWORD },
  });
  expect(res.status()).toBe(201);
  await skipTutorial(page);

  await page.goto("/");
  await expect(page.getByText(/Nodex puede descargar su IA a este dispositivo/)).toBeVisible();
  await page.getByRole("button", { name: "Ahora no" }).click();
  await expect(page.getByText(/Nodex puede descargar su IA/)).toHaveCount(0);

  await page.reload();
  await expect(page.getByRole("searchbox", { name: "Buscar Nodexs" })).toBeVisible();
  await expect(page.getByText(/Nodex puede descargar su IA/)).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem("nodex-ai"))).toBe("off");
});
