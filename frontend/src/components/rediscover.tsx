"use client";

import { History, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { domainOf } from "@/lib/format";
import { useRediscover } from "@/lib/queries/nodexs";

const KEY = "nodex-rediscover-hidden";

function savedOn(iso: string) {
  const date = new Date(iso);
  const otherYear = date.getFullYear() !== new Date().getFullYear();
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short", ...(otherYear && { year: "numeric" }) });
}

const today = () => new Date().toLocaleDateString("sv-SE");

function hiddenToday() {
  try {
    return localStorage.getItem(KEY) === today();
  } catch {
    return false;
  }
}

export function Rediscover({ onOpen }: { onOpen: (id: string) => void }) {
  const [hidden, setHidden] = useState(hiddenToday);
  const rediscover = useRediscover(!hidden);

  if (hidden || !rediscover.data || rediscover.data.length === 0) return null;

  function hide() {
    setHidden(true);
    try {
      localStorage.setItem(KEY, today());
    } catch {}
  }

  return (
    <section aria-labelledby="rediscover-title" className="grid gap-3 rounded-2xl border bg-muted/40 p-4">
      <div className="flex items-start gap-3">
        <History className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h2 id="rediscover-title" className="font-medium">
            Redescubre
          </h2>
          <p className="text-sm text-muted-foreground">Nodexs que hace tiempo que no abres</p>
        </div>
        <Button variant="ghost" size="icon-sm" aria-label="Ocultar hasta mañana" title="Ocultar hasta mañana" onClick={hide}>
          <X />
        </Button>
      </div>
      <ul className="grid gap-2 sm:grid-cols-3">
        {rediscover.data.map((nodex) => (
          <li key={nodex.id}>
            <button
              type="button"
              onClick={() => onOpen(nodex.id)}
              className="grid h-full w-full gap-1 rounded-xl border bg-card p-3 text-left text-sm transition-shadow hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <span className="line-clamp-2 font-medium break-words">{nodex.title}</span>
              <span className="text-xs text-muted-foreground">
                {nodex.url ? `${domainOf(nodex.url)} · ` : ""}
                Guardado el {savedOn(nodex.createdAt)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
