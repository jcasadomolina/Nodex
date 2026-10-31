"use client";

import { LayoutGrid, Plus, Search } from "lucide-react";
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
import { useOpenNodex } from "@/lib/use-open-nodex";
import { useNodexs, useSearch, type NodexQuery } from "@/lib/queries/nodexs";

const INITIAL_QUERY: NodexQuery = { filter: { kind: "all" }, sort: "recent", priority: null };

export function Board() {
  const openNodex = useOpenNodex();
  const [query, setQuery] = useState(INITIAL_QUERY);
  const [creating, setCreating] = useState(false);
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
  const filterName = filter.kind === "orphans" ? "Huérfanos" : filter.kind === "readLater" ? "Leer más tarde" : groupName;
  const crumb = !searching && filterName ? { label: filterName, onClear: () => setQuery({ ...query, filter: { kind: "all" } }) } : undefined;
  const filtered = filter.kind !== "all" || query.priority !== null;

  const createButton = (
    <Button onClick={() => setCreating(true)}>
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
      <TopBar
        icon={searching ? Search : LayoutGrid}
        location={searching ? "Buscar" : "Panel"}
        crumb={crumb}
        search={search}
        onSearchChange={setSearch}
      />
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
        onClick={() => setCreating(true)}
        className="fixed right-6 bottom-24 z-30 size-14 rounded-full shadow-lg hover:scale-105 hover:bg-primary hover:shadow-[0_10px_30px_-8px_var(--primary)] active:scale-95 md:bottom-6 [&_svg]:transition-transform [&_svg]:duration-300 hover:[&_svg]:rotate-90 [&_svg:not([class*='size-'])]:size-6"
      >
        <Plus />
      </Button>
      <Tour />
      <NodexDialog open={creating} onOpenChange={setCreating} />
    </div>
  );
}
