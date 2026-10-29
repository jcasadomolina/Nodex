"use client";

import { FileText, Folder, Trash2 } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Spinner } from "@/components/spinner";
import { TopBar } from "@/components/top-bar";
import { Button } from "@/components/ui/button";
import { useDeleteForever, useEmptyTrash, useRestore, useTrash, type TrashItem, type TrashKind } from "@/lib/queries/trash";
import { cn } from "@/lib/utils";

const TRASH_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

const TABS: { kind: TrashKind; label: string }[] = [
  { kind: "nodexs", label: "Nodexs" },
  { kind: "groups", label: "Grupos" },
];

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

function when(deletedAt: string) {
  const days = Math.floor((Date.now() - new Date(deletedAt).getTime()) / DAY_MS);
  const left = Math.max(0, TRASH_DAYS - days);
  const ago = days === 0 ? "Borrado hoy" : `Borrado hace ${plural(days, "día", "días")}`;
  return `${ago} · se elimina ${left === 0 ? "hoy" : `en ${plural(left, "día", "días")}`}`;
}

function TrashRow({ kind, item, icon }: { kind: TrashKind; item: TrashItem; icon: React.ReactNode }) {
  const restore = useRestore();
  const remove = useDeleteForever();
  const [confirming, setConfirming] = useState(false);
  const busy = restore.isPending || remove.isPending;

  return (
    <li className="flex flex-wrap items-center gap-3 py-3">
      <span className="text-muted-foreground" aria-hidden="true">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{item.name}</p>
        <p className="text-sm text-muted-foreground">
          {when(item.deletedAt)}
          {item.nodexCount !== undefined && ` · ${plural(item.nodexCount, "Nodex", "Nodexs")}`}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" aria-label={`Restaurar «${item.name}»`} disabled={busy} onClick={() => restore.mutate({ kind, id: item.id })}>
          {restore.isPending && <Spinner />} Restaurar
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive"
          aria-label={`Eliminar «${item.name}» para siempre`}
          disabled={busy}
          onClick={() => setConfirming(true)}
        >
          {remove.isPending && <Spinner />} Eliminar para siempre
        </Button>
      </div>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`¿Eliminar «${item.name}» para siempre?`}
        description="No se podrá recuperar."
        confirmLabel="Eliminar"
        onConfirm={() => remove.mutate({ kind, id: item.id })}
      />
    </li>
  );
}

export default function TrashPage() {
  const trash = useTrash();
  const empty = useEmptyTrash();
  const [chosenTab, setTab] = useState<TrashKind | null>(null);
  const [confirmingEmpty, setConfirmingEmpty] = useState(false);
  const total = (trash.data?.nodexs.length ?? 0) + (trash.data?.groups.length ?? 0);
  const tab = chosenTab ?? (trash.data && trash.data.nodexs.length === 0 && trash.data.groups.length > 0 ? "groups" : "nodexs");
  const items = trash.data?.[tab] ?? [];

  return (
    <div className="mx-auto flex w-full max-w-3xl min-w-0 flex-col gap-4">
      <TopBar icon={Trash2} location="Papelera" />

      {trash.isPending && <Spinner className="mx-auto my-12 size-8 text-primary" />}
      {trash.isError && (
        <div className="grid justify-items-center gap-3 py-12 text-center">
          <p className="text-muted-foreground">No se ha podido cargar la papelera</p>
          <Button variant="outline" onClick={() => trash.refetch()}>
            Reintentar
          </Button>
        </div>
      )}
      {trash.data && total === 0 && <p className="py-12 text-center text-muted-foreground">La papelera está vacía</p>}

      {trash.data && total > 0 && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <div role="tablist" aria-label="Contenido de la papelera" className="flex gap-2">
              {TABS.map(({ kind, label }) => (
                <button
                  key={kind}
                  id={`tab-${kind}`}
                  type="button"
                  role="tab"
                  aria-selected={tab === kind}
                  aria-controls="trash-panel"
                  onClick={() => setTab(kind)}
                  className={cn(
                    "h-8 rounded-full border px-3 text-sm transition-colors",
                    tab === kind ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted",
                  )}
                >
                  {label} <span className="opacity-60">{trash.data[kind].length}</span>
                </button>
              ))}
            </div>
            <Button variant="destructive" size="sm" className="ml-auto" disabled={empty.isPending} onClick={() => setConfirmingEmpty(true)}>
              {empty.isPending && <Spinner />} Vaciar papelera
            </Button>
          </div>

          <section id="trash-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="rounded-2xl border bg-card px-4">
            <p className="border-b py-3 text-sm text-muted-foreground">
              Lo que lleva más de {TRASH_DAYS} días en la papelera se elimina para siempre.
            </p>
            {items.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">No hay {tab === "nodexs" ? "Nodexs" : "grupos"} en la papelera</p>
            ) : (
              <ul className="divide-y">
                {items.map((item) => (
                  <TrashRow
                    key={item.id}
                    kind={tab}
                    item={item}
                    icon={tab === "groups" ? <Folder className="size-4" /> : <FileText className="size-4" />}
                  />
                ))}
              </ul>
            )}
          </section>

          <ConfirmDialog
            open={confirmingEmpty}
            onOpenChange={setConfirmingEmpty}
            title="¿Vaciar la papelera?"
            description={`Se eliminarán para siempre ${plural(total, "elemento", "elementos")}. No se podrán recuperar.`}
            confirmLabel="Vaciar"
            onConfirm={() => empty.mutate()}
          />
        </>
      )}
    </div>
  );
}

