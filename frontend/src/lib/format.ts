import type { Priority, TaskStatus } from "./types";

export const PRIORITY_LABELS: Record<Priority, string> = {
  urgent: "Urgente",
  high: "Alta",
  medium: "Media",
  low: "Baja",
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "Pendiente",
  doing: "En curso",
  done: "Hecha",
};

export function toDateInput(iso: string) {
  return new Date(iso).toLocaleDateString("sv-SE");
}

export function fromDateInput(value: string) {
  return new Date(`${value}T00:00`).toISOString();
}

export function domainOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function looksLikeUrl(text: string) {
  if (!/^https?:\/\//i.test(text)) return false;
  try {
    new URL(text);
    return true;
  } catch {
    return false;
  }
}
