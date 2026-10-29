"use client";

import { FileText, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { NodexDialog } from "@/components/nodex-dialog";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { useNodex } from "@/lib/queries/nodexs";
import { closeTab, useTabs } from "@/lib/tabs";
import { preventMiddleScroll } from "@/lib/use-open-nodex";
import { cn } from "@/lib/utils";

function Tab({ id, active, onSelect, onClose }: { id: string; active: boolean; onSelect: () => void; onClose: () => void }) {
  const nodex = useNodex(id);
  const missing = nodex.error instanceof ApiError && nodex.error.status === 404;
  const title = nodex.data?.title ?? (missing ? "No encontrado" : "…");

  return (
    <div
      className={cn(
        "group flex max-w-52 min-w-28 shrink-0 items-center gap-1 rounded-t-xl border border-b-0 pr-1 pl-3 text-sm transition-colors",
        active ? "bg-card text-foreground" : "bg-muted/40 text-muted-foreground hover:bg-muted",
      )}
      onMouseDown={preventMiddleScroll}
      onAuxClick={(event) => event.button === 1 && onClose()}
    >
      <button
        type="button"
        role="tab"
        aria-selected={active}
        tabIndex={active ? 0 : -1}
        onClick={onSelect}
        className="flex min-w-0 flex-1 items-center gap-1.5 py-2 text-left outline-none focus-visible:underline"
      >
        <FileText className="size-3.5 shrink-0" aria-hidden="true" />
        <span className="truncate">{title}</span>
      </button>
      <button
        type="button"
        aria-label={`Cerrar ${title}`}
        tabIndex={-1}
        onClick={onClose}
        className={cn("rounded-md p-1 hover:bg-muted-foreground/20", !active && "opacity-0 group-hover:opacity-100 focus-visible:opacity-100")}
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

let focusAfterNavigation = false;

function modifierKey() {
  return /Mac|iPhone|iPad/.test(navigator.userAgent) ? "⌘" : "Ctrl";
}

export function NodexTabs() {
  const router = useRouter();
  const { tabs, active } = useTabs();
  const [creating, setCreating] = useState(false);
  const tablist = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!focusAfterNavigation) return;
    const selected = tablist.current?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!selected) return;
    focusAfterNavigation = false;
    selected.focus();
  }, [active]);

  function close(id: string) {
    const next = closeTab(id);
    if (id !== active) return;
    router.replace(next ? `/nodexs/${next}` : "/");
  }

  function move(step: number) {
    const index = tabs.indexOf(active ?? "");
    const next = tabs[(index + step + tabs.length) % tabs.length];
    if (!next) return;
    focusAfterNavigation = true;
    router.push(`/nodexs/${next}`);
  }

  if (tabs.length === 0) return null;

  return (
    <div className="flex items-end gap-1 overflow-x-auto border-b">
      <div
        ref={tablist}
        role="tablist"
        aria-label="Nodexs abiertos"
        className="flex items-end gap-1"
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") move(1);
          if (event.key === "ArrowLeft") move(-1);
          if (event.key === "Delete" && active) close(active);
        }}
      >
        {tabs.map((id) => (
          <Tab key={id} id={id} active={id === active} onSelect={() => id !== active && router.push(`/nodexs/${id}`)} onClose={() => close(id)} />
        ))}
      </div>
      <Button variant="ghost" size="sm" className="mb-1 shrink-0" title="Crear un Nodex nuevo en otra pestaña" onClick={() => setCreating(true)}>
        <Plus /> Nuevo
      </Button>
      <p className="mb-2 ml-auto hidden shrink-0 pl-2 text-xs text-muted-foreground md:block">
        <kbd className="rounded border px-1 font-mono">{modifierKey()}</kbd> + clic en un Nodex para abrirlo en otra pestaña
      </p>
      <NodexDialog open={creating} onOpenChange={setCreating} newTab />
    </div>
  );
}
