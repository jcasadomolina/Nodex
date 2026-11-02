import { api, ApiError } from "../api";
import type { NodexMatch } from "../types";
import { aiReady, embed } from "./ai";

let queue: Promise<unknown> = Promise.resolve();

export function syncPending() {
  const run = queue.then(syncOnce);
  queue = run.catch(() => {});
  return run;
}

async function syncOnce() {
  const duplicates = new Map<string, NodexMatch[]>();
  const seen = new Set<string>();
  while (aiReady()) {
    const { nodexs } = await api<{ nodexs: { id: string; text: string }[] }>("/nodexs/pending-embeddings");
    const fresh = nodexs.filter(({ id }) => !seen.has(id));
    if (!fresh.length) break;

    for (const { id, text } of fresh) {
      seen.add(id);
      const embedding = await embed(text);
      if (!embedding) {
        if (!aiReady()) return duplicates;
        continue;
      }
      try {
        const result = await api<{ duplicates: NodexMatch[] }>(`/nodexs/${id}/embedding`, { method: "PUT", body: { text, embedding } });
        duplicates.set(id, result.duplicates);
      } catch (error) {
        if (!(error instanceof ApiError && (error.status === 404 || error.status === 409))) throw error;
      }
    }
  }
  return duplicates;
}
