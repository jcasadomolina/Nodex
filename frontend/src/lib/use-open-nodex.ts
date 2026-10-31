import { useRouter } from "next/navigation";
import { openRight, requestNewTab, useTabs } from "./tabs";

export type OpenTarget = "active" | "newTab" | "right";

export function preventMiddleScroll(event: { button: number; preventDefault: () => void }) {
  if (event.button === 1) event.preventDefault();
}

export function openTarget(event: { ctrlKey: boolean; metaKey: boolean; altKey: boolean; button: number }): OpenTarget {
  const modifier = event.ctrlKey || event.metaKey;
  if (modifier && event.altKey) return "right";
  if (modifier || event.button === 1) return "newTab";
  return "active";
}

export function useOpenNodex() {
  const router = useRouter();
  const { left } = useTabs();

  return (id: string, target: OpenTarget = "active") => {
    if (target === "right" && left.active) {
      openRight(id);
      if (!window.location.pathname.startsWith("/nodexs/")) router.push(`/nodexs/${left.active}`);
      return;
    }
    if (target === "newTab") requestNewTab(id);
    router.push(`/nodexs/${id}`);
  };
}
