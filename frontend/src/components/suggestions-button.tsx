"use client";

import { Check, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useRefreshing, useRefreshSuggestions, useResolveSuggestion, useSuggestions } from "@/lib/queries/suggestions";
import type { Suggestion } from "@/lib/types";

function SuggestionRow({ suggestion, onOpen }: { suggestion: Suggestion; onOpen: (id: string) => void }) {
  const resolve = useResolveSuggestion();
  const answering = resolve.isPending ? resolve.variables.accept : null;

  return (
    <li className="flex items-center gap-2 py-2">
      <button type="button" onClick={() => onOpen(suggestion.nodex.id)} className="min-w-0 flex-1 text-left text-sm hover:underline">
        <span className="block truncate font-medium">{suggestion.nodex.title}</span>
        <span className="block truncate text-muted-foreground">→ {suggestion.group.name}</span>
      </button>
      <Button
        size="icon-sm"
        variant="outline"
        aria-label={`Rechazar ${suggestion.group.name} para ${suggestion.nodex.title}`}
        disabled={resolve.isPending}
        onClick={() => resolve.mutate({ suggestion, accept: false })}
      >
        {answering === false ? <Spinner /> : <X />}
      </Button>
      <Button
        size="icon-sm"
        aria-label={`Añadir ${suggestion.nodex.title} a ${suggestion.group.name}`}
        disabled={resolve.isPending}
        onClick={() => resolve.mutate({ suggestion, accept: true })}
      >
        {answering === true ? <Spinner /> : <Check />}
      </Button>
    </li>
  );
}

export function SuggestionsButton({ onOpen }: { onOpen: (id: string) => void }) {
  const suggestions = useSuggestions();
  const refresh = useRefreshSuggestions();
  const refreshing = useRefreshing();
  const [open, setOpen] = useState(false);
  const list = suggestions.data ?? [];

  if (list.length === 0 && !open) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button className="shrink-0 rounded-full" aria-label={`${list.length} ${list.length === 1 ? "sugerencia" : "sugerencias"} de la IA`}>
          <Sparkles /> {list.length}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <p className="font-medium">Sugerencias de la IA</p>
        {list.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay sugerencias pendientes</p>
        ) : (
          <ul className="max-h-80 divide-y overflow-y-auto">
            {list.map((suggestion) => (
              <SuggestionRow key={suggestion.id} suggestion={suggestion} onOpen={onOpen} />
            ))}
          </ul>
        )}
        <Button variant="outline" className="w-full" disabled={refreshing} onClick={() => refresh.mutate()}>
          {refreshing ? <Spinner /> : <Sparkles />} Revisar huérfanos
        </Button>
      </PopoverContent>
    </Popover>
  );
}
