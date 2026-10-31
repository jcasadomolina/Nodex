"use client";

import { Check, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useRefreshing, useRefreshSuggestions, useResolveNewGroup, useResolveSuggestion, useSuggestions } from "@/lib/queries/suggestions";
import type { NewGroupProposal, Suggestion } from "@/lib/types";

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

function NewGroupRow({ proposal, onOpen }: { proposal: NewGroupProposal; onOpen: (id: string) => void }) {
  const resolve = useResolveNewGroup();
  const [groupName, setGroupName] = useState(proposal.name);
  const answering = resolve.isPending ? resolve.variables.groupName !== null : null;

  return (
    <li className="py-2">
      <form
        className="grid gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (groupName.trim())
            resolve.mutate({
              name: proposal.name,
              groupName: groupName.trim(),
            });
        }}
      >
        <Input
          value={groupName}
          onChange={(event) => setGroupName(event.target.value)}
          maxLength={80}
          aria-label={`Nombre del grupo nuevo «${proposal.name}»`}
        />
        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground">
            {proposal.nodexs.length} {proposal.nodexs.length === 1 ? "Nodex" : "Nodexs"}
          </summary>
          <ul className="mt-1 grid gap-1 pl-4">
            {proposal.nodexs.map((nodex) => (
              <li key={nodex.id}>
                <button type="button" onClick={() => onOpen(nodex.id)} className="block w-full truncate text-left hover:underline">
                  {nodex.title}
                </button>
              </li>
            ))}
          </ul>
        </details>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={resolve.isPending}
            onClick={() => resolve.mutate({ name: proposal.name, groupName: null })}
          >
            {answering === false && <Spinner />} Rechazar
          </Button>
          <Button type="submit" size="sm" disabled={resolve.isPending || groupName.trim() === ""}>
            {answering === true && <Spinner />} Crear grupo
          </Button>
        </div>
      </form>
    </li>
  );
}

export function SuggestionsButton({ onOpen }: { onOpen: (id: string) => void }) {
  const suggestions = useSuggestions();
  const refresh = useRefreshSuggestions();
  const refreshing = useRefreshing();
  const [open, setOpen] = useState(false);
  const list = suggestions.data?.suggestions ?? [];
  const newGroups = suggestions.data?.newGroups ?? [];
  const total = list.length + newGroups.length;

  if (total === 0 && !open) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button className="shrink-0 rounded-full" aria-label={`${total} ${total === 1 ? "sugerencia" : "sugerencias"} de la IA`}>
          <Sparkles /> {total}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="max-h-[70dvh] w-80 overflow-y-auto">
        <p className="font-medium">Sugerencias de la IA</p>
        {total === 0 && <p className="text-sm text-muted-foreground">No hay sugerencias pendientes</p>}
        {list.length > 0 && (
          <ul className="divide-y">
            {list.map((suggestion) => (
              <SuggestionRow key={suggestion.id} suggestion={suggestion} onOpen={onOpen} />
            ))}
          </ul>
        )}
        {newGroups.length > 0 && (
          <section className="grid gap-1 border-t pt-2">
            <h3 className="text-xs font-medium text-muted-foreground uppercase">Grupos nuevos</h3>
            <ul className="divide-y">
              {newGroups.map((proposal) => (
                <NewGroupRow key={proposal.name} proposal={proposal} onOpen={onOpen} />
              ))}
            </ul>
          </section>
        )}
        <Button variant="outline" className="w-full" disabled={refreshing} onClick={() => refresh.mutate()}>
          {refreshing ? <Spinner /> : <Sparkles />} Revisar huérfanos
        </Button>
      </PopoverContent>
    </Popover>
  );
}
