import { writeFile } from "node:fs/promises";
import { embed } from "../lib/embeddings.js";
import { nodexText } from "../modules/ai/vectors.js";
import { DEMO_NODEXS } from "../modules/demo/demo.data.js";

const result = [];
for (const { title, content, url } of DEMO_NODEXS) {
  const text = nodexText({ title, content: content ?? null, url: url ?? null });
  const embedding = (await embed(text)).map((value) => Number(value.toFixed(6)));
  result.push({ title, text, embedding });
}

await writeFile(new URL("../modules/demo/demo.embeddings.json", import.meta.url), JSON.stringify(result));
console.log(`Vectores de la demo guardados: ${result.length}`);
