export const TUTORIAL_VERSION = 1;

const KEY = "nodex-tour";

let pending = false;

export function startTour() {
  pending = true;
  try {
    sessionStorage.setItem(KEY, "1");
  } catch {}
}

export function tourPending() {
  try {
    return pending || sessionStorage.getItem(KEY) === "1";
  } catch {
    return pending;
  }
}

export function endTour() {
  pending = false;
  try {
    sessionStorage.removeItem(KEY);
  } catch {}
}
