import { useSyncExternalStore } from "react";

export type TabsState = { tabs: string[]; active: string | null };

const KEY = "nodex-tabs";
const MAX_TABS = 20;
const EMPTY: TabsState = { tabs: [], active: null };

let state: TabsState | null = null;
let pendingNewTab: string | null = null;
const listeners = new Set<() => void>();

function read(): TabsState {
  if (state) return state;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "null");
    const tabs: string[] = Array.isArray(saved?.tabs) ? saved.tabs.filter((t: unknown) => typeof t === "string") : [];
    state = { tabs, active: tabs.includes(saved?.active) ? saved.active : null };
  } catch {
    state = EMPTY;
  }
  return state!;
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

export function showInTabs(id: string) {
  const { tabs, active } = read();
  const wantsNew = pendingNewTab === id;
  pendingNewTab = null;

  if (tabs.includes(id)) {
    if (active !== id) write({ tabs, active: id });
    return;
  }

  let next = wantsNew || active === null || !tabs.includes(active) ? [...tabs, id] : tabs.map((tab) => (tab === active ? id : tab));
  while (next.length > MAX_TABS) {
    const oldest = next.findIndex((tab) => tab !== id);
    next = next.filter((_, index) => index !== oldest);
  }
  write({ tabs: next, active: id });
}

export function closeTab(id: string) {
  const { tabs, active } = read();
  const index = tabs.indexOf(id);
  if (index === -1) return active;
  const rest = tabs.filter((tab) => tab !== id);
  const nextActive = active === id ? (rest[index] ?? rest[index - 1] ?? null) : active;
  write({ tabs: rest, active: nextActive });
  return nextActive;
}
