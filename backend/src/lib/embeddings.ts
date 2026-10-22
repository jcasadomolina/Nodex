import path from "node:path";
import { env as transformersEnv, pipeline, type FeatureExtractionPipeline } from "@huggingface/transformers";

transformersEnv.cacheDir = path.resolve(".cache/models");

const MODEL = "Xenova/paraphrase-multilingual-MiniLM-L12-v2";

let extractor: Promise<FeatureExtractionPipeline> | undefined;

function getExtractor() {
  extractor ??= pipeline("feature-extraction", MODEL, { dtype: "q8" });
  return extractor;
}

export async function embed(text: string) {
  const model = await getExtractor();
  const output = await model(text, { pooling: "mean", normalize: true });
  return Array.from(output.data as Float32Array);
}

export function toVector(values: number[]) {
  return `[${values.join(",")}]`;
}
