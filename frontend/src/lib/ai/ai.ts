import { useSyncExternalStore } from "react";

const KEY = "nodex-ai";
const OFF: AiStatus = { state: "off" };

export type AiStatus = { state: "off" } | { state: "loading"; progress: number } | { state: "ready" };

let status: AiStatus = OFF;
let worker: Worker | null = null;
let loading: Promise<void> | null = null;
let nextId = 0;
const listeners = new Set<() => void>();
const waiting = new Map<number, (embedding: number[] | null) => void>();

function setStatus(next: AiStatus) {
  status = next;
  listeners.forEach((listener) => listener());
}

function stop() {
  worker?.terminate();
  worker = null;
  loading = null;
  waiting.forEach((resolve) => resolve(null));
  waiting.clear();
  setStatus(OFF);
}

export function getPreference() {
  const value = localStorage.getItem(KEY);
  return value === "on" || value === "off" ? value : null;
}

export function setPreference(value: "on" | "off") {
  localStorage.setItem(KEY, value);
}

export function getAiStatus() {
  return status;
}

export function aiReady() {
  return status.state === "ready";
}

export function useAiStatus() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => status,
    () => OFF,
  );
}

export function enableAi() {
  setPreference("on");
  loading ??= new Promise<void>((resolve, reject) => {
    worker = new Worker(new URL("./embedding-worker.ts", import.meta.url), { type: "module" });
    setStatus({ state: "loading", progress: 0 });
    worker.onmessage = ({ data }) => {
      if (data.type === "progress") setStatus({ state: "loading", progress: data.progress });
      if (data.type === "ready") {
        setStatus({ state: "ready" });
        resolve();
      }
      if (data.type === "error") {
        stop();
        reject(new Error(data.message));
      }
      if (data.type === "vector") {
        waiting.get(data.id)?.(data.embedding);
        waiting.delete(data.id);
      }
    };
    worker.onerror = (event) => {
      stop();
      reject(new Error(event.message));
    };
    worker.postMessage({ type: "load" });
  });
  return loading;
}

export function disableAi() {
  setPreference("off");
  stop();
}

export function deleteModel() {
  return caches.delete("transformers-cache");
}

export function embed(text: string): Promise<number[] | null> {
  const current = worker;
  if (!aiReady() || !current) return Promise.resolve(null);
  const id = nextId++;
  return new Promise((resolve) => {
    waiting.set(id, resolve);
    current.postMessage({ type: "embed", id, text });
  });
}
