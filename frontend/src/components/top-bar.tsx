"use client";

import { Search, X } from "lucide-react";

type TopBarProps = {
  location: string;
  search?: string;
  onSearchChange?: (q: string) => void;
};

export function TopBar({ location, search = "", onSearchChange }: TopBarProps) {
  return (
    <header className="sticky top-3 z-30 mx-auto flex w-full max-w-2xl items-center gap-3 rounded-full bg-primary px-5 py-2 text-primary-foreground shadow-md">
      <span className="shrink-0 truncate font-medium">{location}</span>
      {onSearchChange && (
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-white/40 px-3 py-1">
          <Search className="size-4 shrink-0" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            onKeyDown={(event) => event.key === "Escape" && onSearchChange("")}
            placeholder="Buscar…"
            aria-label="Buscar Nodexs"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-primary-foreground/70 [&::-webkit-search-cancel-button]:hidden"
          />
          {search && (
            <button type="button" aria-label="Borrar búsqueda" onClick={() => onSearchChange("")}>
              <X className="size-4" />
            </button>
          )}
        </label>
      )}
    </header>
  );
}
