import { test as setup } from "@playwright/test";
import { register, skipTutorial } from "./helpers";

setup("registrar el usuario compartido", async ({ page }) => {
  await register(page);
  await skipTutorial(page);
  await page.context().storageState({ path: ".auth/usuario.json" });
});
