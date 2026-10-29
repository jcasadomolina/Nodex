"use client";

import { ChevronRight, Search, X, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { Avatar } from "@/components/avatar";
import { useMe } from "@/lib/queries/auth";
import { cn } from "@/lib/utils";

type TopBarProps = {
  icon: LucideIcon;
  location: string;
  crumb?: { label: string; onClear: () => void };
  search?: string;
  onSearchChange?: (q: string) => void;
};

function greeting() {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 13) return "Buenos días";
  if (hour >= 6 && hour < 21) return "Buenas tardes";
  return "Buenas noches";
}

const subscribeNever = () => () => {};

function isTyping(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
}

export function TopBar({ icon: Icon, location, crumb, search = "", onSearchChange }: TopBarProps) {
  const me = useMe();
  const hydrated = useSyncExternalStore(subscribeNever, () => true, () => false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!onSearchChange) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey || isTyping(event.target)) return;
      event.preventDefault();
      input.current?.focus();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onSearchChange]);

  return (
    <header className="sticky top-3 z-30 mx-auto flex w-full max-w-3xl items-center gap-3 rounded-full bg-primary py-1.5 pr-1.5 pl-4 text-primary-foreground shadow-md">
      <nav aria-label="Estás en" className="flex min-w-0 items-center gap-1.5 font-semibold">
        <Icon className="size-5 shrink-0" aria-hidden="true" />
        <span className={cn("truncate", crumb && "max-sm:sr-only")}>{location}</span>
        {crumb && (
          <>
            <ChevronRight className="size-4 shrink-0 opacity-60 max-sm:hidden" aria-hidden="true" />
            <span className="flex min-w-0 max-w-40 items-center gap-1 rounded-full bg-primary-foreground py-0.5 pr-1 pl-2.5 text-sm text-primary animate-in fade-in zoom-in-95">
              <span className="truncate">{crumb.label}</span>
              <button
                type="button"
                aria-label={`Quitar filtro ${crumb.label}`}
                onClick={crumb.onClear}
                className="rounded-full p-0.5 transition-colors hover:bg-white/15"
              >
                <X className="size-3.5" />
              </button>
            </span>
          </>
        )}
      </nav>
      {onSearchChange ? (
        <label
          data-tour="buscar"
          className="flex min-w-28 flex-1 items-center gap-2 rounded-full bg-white/40 px-3 py-1 transition-[background-color,box-shadow] duration-200 focus-within:bg-white/70 focus-within:ring-2 focus-within:ring-primary-foreground/40"
        >
          <Search className="size-4 shrink-0" aria-hidden="true" />
          <input
            ref={input}
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            onKeyDown={(event) => event.key === "Escape" && onSearchChange("")}
            placeholder="Buscar…"
            aria-label="Buscar Nodexs"
            aria-keyshortcuts="/"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-primary-foreground/70 [&::-webkit-search-cancel-button]:hidden"
          />
          {search ? (
            <button type="button" aria-label="Borrar búsqueda" onClick={() => onSearchChange("")}>
              <X className="size-4" />
            </button>
          ) : (
            <kbd aria-hidden="true" className="hidden rounded-md border border-primary-foreground/25 px-1.5 font-mono text-xs leading-5 opacity-70 md:block">
              /
            </kbd>
          )}
        </label>
      ) : (
        <div className="flex-1" />
      )}
      {hydrated && me.data && (
        <Link
          href="/perfil"
          aria-label="Tu perfil"
          className="flex shrink-0 items-center gap-2 rounded-full py-0.5 pr-0.5 pl-3 text-sm font-medium transition-colors hover:bg-white/30"
        >
          <span className="hidden lg:inline">
            {greeting()}, {me.data.name.trim().split(/\s+/)[0]}
          </span>
          <Avatar name={me.data.name} url={me.data.avatarUrl} className="size-8 bg-primary-foreground text-primary" />
        </Link>
      )}
    </header>
  );
}
