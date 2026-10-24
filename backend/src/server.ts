import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
import { startLinkWorker } from "./modules/links/links.worker.js";
import { startReminderWorker } from "./modules/reminders/reminders.worker.js";

const server = app.listen(env.PORT, () => {
  console.log(`Backend de Nodex escuchando en http://localhost:${env.PORT}`);
  startReminderWorker();
  startLinkWorker();
});

// Cerrar el servidor y desconectar de la base de datos
function shutdown() {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
