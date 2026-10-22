import { prisma } from "../lib/prisma.js";
import { updateEmbedding } from "../modules/ai/ai.service.js";

const pending = await prisma.$queryRaw<{ id: string }[]>`
  SELECT id FROM nodexs WHERE deleted_at IS NULL AND embedding IS NULL
`;

console.log(`Nodexs sin vector: ${pending.length}`);

let failed = 0;
for (const [i, { id }] of pending.entries()) {
  try {
    await updateEmbedding(id);
  } catch (err) {
    failed++;
    console.error(`Error con el Nodex ${id}:`, err);
  }
  if ((i + 1) % 50 === 0) console.log(`${i + 1}/${pending.length}`);
}

console.log(`Terminado: ${pending.length - failed} calculados, ${failed} con error`);
await prisma.$disconnect();
