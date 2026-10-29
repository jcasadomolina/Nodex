import { useRouter } from "next/navigation";
import { requestNewTab } from "./tabs";

export function preventMiddleScroll(event: { button: number; preventDefault: () => void }) {
  if (event.button === 1) event.preventDefault();
}

export function newTabClick(event: { ctrlKey: boolean; metaKey: boolean; button: number }) {
  return event.ctrlKey || event.metaKey || event.button === 1;
}

export function useOpenNodex() {
  const router = useRouter();

  return (id: string, newTab = false) => {
    if (newTab) requestNewTab(id);
    router.push(`/nodexs/${id}`);
  };
}
