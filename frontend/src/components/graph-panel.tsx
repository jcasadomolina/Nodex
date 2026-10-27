"use client";

import { RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEFAULT_SETTINGS, type GraphSettings } from "@/lib/graph-settings";
import type { Group } from "@/lib/types";
import { cn } from "@/lib/utils";

type GraphPanelProps = {
  settings: GraphSettings;
  onChange: (settings: GraphSettings) => void;
  groups: Group[];
  onExport: (format: "svg" | "png" | "jpeg") => void;
  onClose: () => void;
  className?: string;
};

function Section({ title, open, children }: { title: string; open?: boolean; children: React.ReactNode }) {
  return (
    <details open={open} className="group border-b py-3 last:border-b-0">
      <summary className="cursor-pointer list-none font-bold select-none before:mr-2 before:inline-block before:transition-transform before:content-['›'] group-open:before:rotate-90">
        {title}
      </summary>
      <div className="mt-3 grid gap-3">{children}</div>
    </details>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 text-sm">
      {label}
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-primary" />
    </label>
  );
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="flex justify-between">
        {label}
        <span className="text-muted-foreground">{value.toFixed(1)}</span>
      </span>
      <input type="range" min={0.1} max={2} step={0.1} value={value} onChange={(e) => onChange(Number(e.target.value))} className="accent-primary" />
    </label>
  );
}

export function GraphPanel({ settings, onChange, groups, onExport, onClose, className }: GraphPanelProps) {
  const set = (patch: Partial<GraphSettings>) => onChange({ ...settings, ...patch });

  return (
    <aside aria-label="Ajustes del grafo" className={cn("absolute top-3 right-3 z-10 max-h-[calc(100%-1.5rem)] w-72 overflow-y-auto rounded-2xl border bg-card/95 px-4 shadow-xl", className)}>
      <div className="sticky top-0 flex items-center justify-between bg-card/95 pt-3">
        <h2 className="font-bold">Ajustes del grafo</h2>
        <div className="flex">
          <Button variant="ghost" size="icon-sm" aria-label="Restablecer ajustes" onClick={() => onChange(DEFAULT_SETTINGS)}>
            <RotateCcw />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Cerrar ajustes" onClick={onClose}>
            <X />
          </Button>
        </div>
      </div>

      <Section title="Filtros" open>
        <Input type="search" value={settings.search} onChange={(e) => set({ search: e.target.value })} placeholder="Buscar Nodexs…" aria-label="Buscar en el grafo" />
        <Toggle label="Etiquetas" checked={settings.showTags} onChange={(showTags) => set({ showTags })} />
        <Toggle label="Huérfanos" checked={settings.showOrphans} onChange={(showOrphans) => set({ showOrphans })} />
      </Section>

      <Section title="Grupos">
        {groups.length === 0 && <p className="text-sm text-muted-foreground">Aún no tienes grupos</p>}
        {groups.map((g) => (
          <Toggle
            key={g.id}
            label={g.name}
            checked={!settings.hiddenGroups.includes(g.id)}
            onChange={(checked) =>
              set({ hiddenGroups: checked ? settings.hiddenGroups.filter((id) => id !== g.id) : [...settings.hiddenGroups, g.id] })
            }
          />
        ))}
      </Section>

      <Section title="Colores">
        <p className="text-xs text-muted-foreground">
          Consulta: una palabra, <code>grupo:</code>, <code>etiqueta:</code>, <code>prioridad:</code> o <code>tipo:enlace</code>. Gana la primera que coincide.
        </p>
        {settings.rules.map((rule, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              value={rule.query}
              onChange={(e) => set({ rules: settings.rules.map((r, j) => (j === i ? { ...r, query: e.target.value } : r)) })}
              placeholder="etiqueta:cocina"
              aria-label="Consulta de color"
            />
            <input
              type="color"
              value={rule.color}
              onChange={(e) => set({ rules: settings.rules.map((r, j) => (j === i ? { ...r, color: e.target.value } : r)) })}
              aria-label="Color"
              className="size-8 shrink-0 cursor-pointer rounded-full border-0 bg-transparent p-0"
            />
            <Button variant="ghost" size="icon-sm" aria-label="Quitar color" onClick={() => set({ rules: settings.rules.filter((_, j) => j !== i) })}>
              <X />
            </Button>
          </div>
        ))}
        <Button variant="outline" onClick={() => set({ rules: [...settings.rules, { query: "", color: "#e05252" }] })}>
          Nuevo color
        </Button>
      </Section>

      <Section title="Mostrar">
        <Toggle label="Flechas" checked={settings.arrows} onChange={(arrows) => set({ arrows })} />
        <Toggle label="Relacionados por la IA" checked={settings.related} onChange={(related) => set({ related })} />
        <Slider label="Tamaño de los nodos" value={settings.nodeSize} onChange={(nodeSize) => set({ nodeSize: Math.max(0.5, nodeSize) })} />
        <Slider label="Grosor de las líneas" value={settings.lineWidth} onChange={(lineWidth) => set({ lineWidth })} />
      </Section>

      <Section title="Exportar">
        <div className="grid grid-cols-3 gap-2">
          {(["svg", "png", "jpeg"] as const).map((format) => (
            <Button key={format} variant="outline" onClick={() => onExport(format)}>
              {format.toUpperCase()}
            </Button>
          ))}
        </div>
      </Section>
    </aside>
  );
}
