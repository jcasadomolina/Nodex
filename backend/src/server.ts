import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";

const server = app.listen(env.PORT, () => {
  console.log(`Backend de Nodex escuchando en http://localhost:${env.PORT}`);
});

// Al parar el servidor (Ctrl+C o el alojamiento al reiniciar), se terminan las
// peticiones en curso y se cierra la conexión con la base antes de salir
function shutdown() {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
