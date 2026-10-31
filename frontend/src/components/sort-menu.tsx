"use client";

import { ListFilter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PRIORITY_LABELS } from "@/lib/format";
import type { NodexQuery } from "@/lib/queries/nodexs";
import type { Priority } from "@/lib/types";

type SortValue = Pick<NodexQuery, "sort" | "priority">;

type SortMenuProps = SortValue & {
  onChange: (value: SortValue) => void;
};

export function SortMenu({ sort, priority, onChange }: SortMenuProps) {
  const active = sort !== "recent" || priority !== null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={active ? "default" : "outline"} className="shrink-0 rounded-full" aria-label="Ordenar y filtrar" data-tour="ordenar">
          <ListFilter />
          <span className="hidden sm:inline">Ordenar y filtrar</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Ordenar</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={sort} onValueChange={(value) => onChange({ sort: value as SortValue["sort"], priority })}>
          <DropdownMenuRadioItem value="recent">Más recientes</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="priority">Por prioridad</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Prioridad</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={priority ?? "all"}
          onValueChange={(value) => onChange({ sort, priority: value === "all" ? null : (value as Priority) })}
        >
          <DropdownMenuRadioItem value="all">Todas</DropdownMenuRadioItem>
          {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
            <DropdownMenuRadioItem key={value} value={value}>
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
