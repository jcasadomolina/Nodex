"use client";

import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { GroupFilter } from "@/components/group-filter";
import { NodexDialog } from "@/components/nodex-dialog";
import { NodexGrid } from "@/components/nodex-grid";
import { Rediscover } from "@/components/rediscover";
import { Tour } from "@/components/tour";
import { SortMenu } from "@/components/sort-menu";
import { SuggestionsButton } from "@/components/suggestions-button";
import { TopBar } from "@/components/top-bar";
import { Button } from "@/components/ui/button";
import { useGroups } from "@/lib/queries/groups";
import { useNodexs, useSearch, type NodexQuery } from "@/lib/queries/nodexs";

const INITIAL_QUERY: NodexQuery = { filter: { kind: "all" }, sort: "recent", priority: null };

export function Board({ openId }: { openId?: string }) {
  const [query, setQuery] = useState(INITIAL_QUERY);
  const [dialog, setDialog] = useState({ open: Boolean(openId), id: openId ?? null });
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const groups = useGroups();
  const nodexs = useNodexs(query);
  const results = useSearch(debouncedSearch);
  const groupList = groups.data ?? [];
  const searching = debouncedSearch.length > 0;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { filter } = query;
  const groupName = filter.kind === "group" ? groupList.find((g) => g.id === filter.groupId)?.name : null;
  const location = searching
    ? "Buscar"
    : filter.kind === "orphans"
      ? "Panel · Huérfanos"
      : groupName
        ? `Panel · ${groupName}`
        : "Panel";
  const filtered = filter.kind !== "all" || query.priority !== null;

  function openNodex(id: string) {
    setDialog({ open: true, id });
    window.history.pushState(null, "", `/nodexs/${id}`);
  }

  function changeDialog(open: boolean) {
    setDialog((current) => ({ ...current, open }));
    if (!open && window.location.pathname !== "/") window.history.pushState(null, "", "/");
  }

  const createButton = (
    <Button onClick={() => setDialog({ open: true, id: null })}>
      <Plus /> Crear el primero
    </Button>
  );

  const failed = searching ? results.isError : nodexs.isError;

  const empty = failed ? (
    <>
      <p className="text-muted-foreground">No se han podido cargar los Nodexs</p>
      <Button variant="outline" onClick={() => (searching ? results.refetch() : nodexs.refetch())}>
        Reintentar
      </Button>
    </>
  ) : searching ? (
    <>
      <p className="text-muted-foreground">Nada coincide con «{debouncedSearch}»</p>
      <Button variant="outline" onClick={() => setSearch("")}>
        Borrar búsqueda
      </Button>
    </>
  ) : filtered ? (
    <>
      <p className="text-muted-foreground">No hay nada aquí</p>
      <Button variant="outline" onClick={() => setQuery(INITIAL_QUERY)}>
        Ver todos
      </Button>
    </>
  ) : (
    <>
      <p className="text-muted-foreground">Aún no tienes Nodexs</p>
      {createButton}
    </>
  );

  return (
    <div className="mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-4">
      <TopBar location={location} search={search} onSearchChange={setSearch} />
      {searching ? (
        <NodexGrid nodexs={results.data ?? []} groups={groupList} onOpen={openNodex} loading={results.isPending} empty={empty} />
      ) : (
        <>
          <div className="flex min-w-0 items-center gap-3">
            <GroupFilter value={filter} onChange={(f) => setQuery({ ...query, filter: f })} />
            <SuggestionsButton onOpen={openNodex} />
            <SortMenu sort={query.sort} priority={query.priority} onChange={(v) => setQuery({ ...query, ...v })} />
          </div>
          {!filtered && <Rediscover onOpen={openNodex} />}
          <NodexGrid
            nodexs={nodexs.data?.pages.flatMap((page) => page.nodexs) ?? []}
            groups={groupList}
            onOpen={openNodex}
            loading={nodexs.isPending}
            empty={empty}
            hasMore={nodexs.hasNextPage}
            loadingMore={nodexs.isFetchingNextPage}
            onLoadMore={() => nodexs.fetchNextPage()}
          />
        </>
      )}
      <Button
        size="icon-lg"
        aria-label="Crear Nodex"
        data-tour="crear"
        onClick={() => setDialog({ open: true, id: null })}
        className="fixed right-6 bottom-24 z-30 size-14 rounded-full shadow-lg md:bottom-6 [&_svg:not([class*='size-'])]:size-6"
      >
        <Plus />
      </Button>
      <Tour />
      <NodexDialog id={dialog.id} open={dialog.open} onOpenChange={changeDialog} onOpenNodex={openNodex} />
    </div>
  );
}
