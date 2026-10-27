"use client";

import { Search } from "lucide-react";
import { NodexCard } from "@/components/nodex-card";
import { Badge } from "@/components/ui/badge";
import type { Group, Nodex } from "@/lib/types";

const groups: Group[] = [
  { id: "cocina", name: "Cocina", description: null, createdAt: "", updatedAt: "" },
  { id: "viajes", name: "Viajes", description: null, createdAt: "", updatedAt: "" },
];

function sample(id: string, title: string, extra: Partial<Nodex> = {}): Nodex {
  return {
    id,
    type: "note",
    title,
    content: null,
    url: null,
    priority: null,
    groupIds: [],
    createdAt: "",
    updatedAt: "",
    linkPreview: null,
    ...extra,
  };
}

const board = [
  sample("1", "Receta de lentejas con chorizo", { content: "Sofrito de cebolla, pimiento y ajo; pimentón y 40 minutos.", priority: "high", groupIds: ["cocina"] }),
  sample("2", "Vuelos a Lisboa", { content: "Mirar marzo. Hotel cerca de Alfama.", priority: "urgent", groupIds: ["viajes"] }),
  sample("3", "Documentación de React", { type: "link", url: "https://react.dev/learn", priority: "low" }),
  sample("4", "Ideas para el portfolio", { content: "Una app de notas con IA que agrupa sola." }),
];

const noop = () => {};

function Frame({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="preview-view absolute inset-0 grid content-start gap-3 p-4">
      <div className="flex items-center gap-2">
        <span className="size-2.5 rounded-full bg-primary" />
        <span className="rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">{label}</span>
      </div>
      {children}
    </div>
  );
}

export function AppPreview({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" inert className={className}>
      <div className="relative h-[26rem] overflow-hidden rounded-3xl border bg-background/95 text-sm shadow-2xl">
        <Frame label="Panel">
          <div className="columns-2 gap-3 [&_button]:mb-3">
            {board.map((nodex) => (
              <NodexCard key={nodex.id} nodex={nodex} groups={groups} onOpen={noop} />
            ))}
          </div>
        </Frame>
        <Frame label="Receta de lentejas con chorizo">
          <div className="grid gap-3 rounded-2xl border bg-card p-4">
            <p className="text-base font-bold">Receta de lentejas con chorizo</p>
            <p className="text-muted-foreground">Sofrito de cebolla, pimiento y ajo; añadir pimentón y cocer 40 minutos.</p>
            <div className="flex gap-1">
              <Badge>Alta</Badge>
              <Badge variant="outline">Cocina</Badge>
            </div>
            <div className="grid gap-1 border-t pt-3">
              <p className="font-semibold">Relacionados</p>
              <p className="rounded-lg bg-muted px-2 py-1.5">Guiso de garbanzos con espinacas</p>
              <p className="rounded-lg bg-muted px-2 py-1.5">Tortilla de patatas jugosa</p>
            </div>
          </div>
        </Frame>
        <Frame label="Buscar">
          <div className="flex items-center gap-2 rounded-full border bg-card px-3 py-2">
            <Search className="size-4 text-muted-foreground" />
            comida de cuchara
          </div>
          <div className="columns-2 gap-3 [&_button]:mb-3">
            <NodexCard nodex={board[0]} groups={groups} onOpen={noop} />
            <NodexCard nodex={sample("5", "Guiso de garbanzos con espinacas", { content: "Plato de cuchara de Semana Santa.", groupIds: ["cocina"] })} groups={groups} onOpen={noop} />
          </div>
        </Frame>
      </div>
    </div>
  );
}
