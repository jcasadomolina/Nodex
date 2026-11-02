import { env, pipeline, type FeatureExtractionPipeline, type ProgressInfo } from "@huggingface/transformers";

env.allowLocalModels = false;

let extractor: FeatureExtractionPipeline | null = null;

function onProgress(info: ProgressInfo) {
  if (info.status === "progress" && info.file.endsWith(".onnx")) {
    self.postMessage({ type: "progress", progress: Math.round(info.progress) });
  }
}

self.onmessage = async ({ data }: MessageEvent<{ type: "load" } | { type: "embed"; id: number; text: string }>) => {
  if (data.type === "load") {
    try {
      extractor = await pipeline("feature-extraction", "Xenova/paraphrase-multilingual-MiniLM-L12-v2", {
        dtype: "q8",
        progress_callback: onProgress,
      });
      self.postMessage({ type: "ready" });
    } catch (error) {
      self.postMessage({ type: "error", message: error instanceof Error ? error.message : String(error) });
    }
  }

  if (data.type === "embed") {
    try {
      const output = await extractor!(data.text, { pooling: "mean", normalize: true });
      self.postMessage({ type: "vector", id: data.id, embedding: Array.from(output.data as Float32Array) });
    } catch {
      self.postMessage({ type: "vector", id: data.id, embedding: null });
    }
  }
};
