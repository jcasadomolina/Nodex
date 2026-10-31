import { useSyncExternalStore } from "react";

export type Pane = { tabs: string[]; active: string | null };
export type Side = "left" | "right";
export type TabsState = { left: Pane; right: Pane | null; split: number };

const KEY = "nodex-tabs";
const MAX_TABS = 20;
const MIN_SPLIT = 25;
const MAX_SPLIT = 75;
const EMPTY: TabsState = { left: { tabs: [], active: null }, right: null, split: 50 };

let state: TabsState | null = null;
let pendingNewTab: string | null = null;
const listeners = new Set<() => void>();

function toPane(saved: unknown): Pane {
  const raw = saved as { tabs?: unknown; active?: unknown } | null;
  const tabs = Array.isArray(raw?.tabs) ? raw.tabs.filter((t): t is string => typeof t === "string") : [];
  const active = typeof raw?.active === "string" && tabs.includes(raw.active) ? raw.active : null;
  return { tabs, active };
}

export function clampSplit(value: number) {
  return Math.min(MAX_SPLIT, Math.max(MIN_SPLIT, Number.isFinite(value) ? value : 50));
}

function read(): TabsState {
  if (state) return state;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (saved && "left" in saved) {
      const right = toPane(saved.right);
      state = { left: toPane(saved.left), right: right.tabs.length ? right : null, split: clampSplit(saved.split) };
    } else {
      state = { ...EMPTY, left: toPane(saved) };
    }
  } catch {
    state = EMPTY;
  }
  return state;
}

function write(next: TabsState) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useTabs() {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function requestNewTab(id: string) {
  pendingNewTab = id;
}

function show(pane: Pane | null, id: string, newTab: boolean): Pane {
  const { tabs, active } = pane ?? { tabs: [], active: null };
  if (tabs.includes(id)) return { tabs, active: id };
  let next = newTab || active === null || !tabs.includes(active) ? [...tabs, id] : tabs.map((tab) => (tab === active ? id : tab));
  while (next.length > MAX_TABS) {
    const oldest = next.findIndex((tab) => tab !== id);
    next = next.filter((_, index) => index !== oldest);
  }
  return { tabs: next, active: id };
}

export function showInTabs(id: string) {
  const current = read();
  const wantsNew = pendingNewTab === id;
  pendingNewTab = null;
  if (current.left.active === id && current.left.tabs.includes(id)) return;
  write({ ...current, left: show(current.left, id, wantsNew) });
}

export function showInRight(id: string, newTab: boolean) {
  const current = read();
  write({ ...current, right: show(current.right, id, newTab) });
}

export function openRight(id: string) {
  showInRight(id, true);
}

export function activateRight(id: string) {
  const current = read();
  if (current.right?.tabs.includes(id)) write({ ...current, right: { ...current.right, active: id } });
}

export function closeTab(side: Side, id: string) {
  const current = read();
  const pane = current[side];
  if (!pane) return null;
  const index = pane.tabs.indexOf(id);
  if (index === -1) return pane.active;
  const rest = pane.tabs.filter((tab) => tab !== id);
  const active = pane.active === id ? (rest[index] ?? rest[index - 1] ?? null) : pane.active;
  const next = { tabs: rest, active };
  write(side === "left" ? { ...current, left: next } : { ...current, right: rest.length ? next : null });
  return active;
}

export function setSplit(value: number) {
  const current = read();
  write({ ...current, split: clampSplit(value) });
}
