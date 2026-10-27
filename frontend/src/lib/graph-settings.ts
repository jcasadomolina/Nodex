import { PRIORITY_LABELS } from "./format";
import type { Nodex } from "./types";

export type ColorRule = { query: string; color: string };

export type GraphSettings = {
  search: string;
  showTags: boolean;
  showOrphans: boolean;
  hiddenGroups: string[];
  rules: ColorRule[];
  arrows: boolean;
  related: boolean;
  nodeSize: number;
  lineWidth: number;
};

export const DEFAULT_SETTINGS: GraphSettings = {
  search: "",
  showTags: false,
  showOrphans: true,
  hiddenGroups: [],
  rules: [],
  arrows: false,
  related: false,
  nodeSize: 1,
  lineWidth: 1,
};

const KEY = "nodex-graph";

export function loadSettings(): GraphSettings {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: GraphSettings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {}
}

export function matchesRule(query: string, nodex: Nodex, groupNames: string[]) {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  const [key, ...rest] = q.split(":");
  const value = rest.join(":").trim().replace(/^#/, "");
  const text = `${nodex.title} ${nodex.content ?? ""}`.toLowerCase();

  if (rest.length === 0) return text.includes(q);
  if (key === "grupo") return groupNames.some((name) => name.toLowerCase() === value);
  if (key === "etiqueta") return nodex.tags.includes(value);
  if (key === "prioridad") return nodex.priority !== null && PRIORITY_LABELS[nodex.priority].toLowerCase() === value;
  if (key === "tipo") return (value === "enlace" && nodex.type === "link") || (value === "nota" && nodex.type === "note");
  return text.includes(q);
}
