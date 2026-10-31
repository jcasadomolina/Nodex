"use client";

import { ArrowLeft, Clock, ExternalLink, LayoutGrid, MoreHorizontal, Pencil, SquareSplitHorizontal } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Markdown } from "@/components/markdown";
import { NodexTabs } from "@/components/nodex-tabs";
import { DueDateInput, GroupToggles, PrioritySelect, ReminderInput, Switch, TaskStatusSelect } from "@/components/nodex-fields";
import { Spinner } from "@/components/spinner";
import { TagInput } from "@/components/tag-input";
import { TopBar } from "@/components/top-bar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api";
import { domainOf, formatDateTime } from "@/lib/format";
import { useRefreshLink } from "@/lib/queries/alerts";
import { useDeleteNodex, useMarkOpened, useNodex, useRelated, useSetReadLater, useUpdateNodex, type NodexInput } from "@/lib/queries/nodexs";
import { useUndoDelete } from "@/lib/queries/trash";
import { clampSplit, closeTab, openRight, setSplit, showInRight, showInTabs, useTabs, type Side } from "@/lib/tabs";
import { openTarget, preventMiddleScroll, useOpenNodex, type OpenTarget } from "@/lib/use-open-nodex";
import type { Nodex, TaskInput } from "@/lib/types";
import { cn } from "@/lib/utils";

const AUTOSAVE_MS = 1000;

type Changes = { changes?: Partial<Omit<NodexInput, "type">>; groupIds?: string[]; task?: TaskInput | null; reminder?: string | null };

const complete = (iso: string | null) => iso === null || new Date(iso).getFullYear() >= 1000;

function useSave(nodex: Nodex) {
  const update = useUpdateNodex();
  return {
    pending: update.isPending,
    save: ({ changes = {}, groupIds = nodex.groupIds, task, reminder }: Changes, onSuccess?: () => void) =>
      update.mutate(
        { id: nodex.id, changes, groupIds, previousGroupIds: nodex.groupIds, task, reminder },
        { onSuccess },
      ),
  };
}

function Property({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 py-2.5 sm:grid-cols-[9rem_1fr] sm:items-start sm:gap-4">
      <dt className="pt-1.5 text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}

function Title({ nodex }: { nodex: Nodex }) {
  const { save } = useSave(nodex);
  const [editing, setEditing] = useState(false);
  const cancelled = useRef(false);

  if (!editing) {
    return (
      <h1 className="text-3xl font-semibold break-words">
        <button
          type="button"
          className="cursor-text text-left"
          onClick={() => {
            cancelled.current = false;
            setEditing(true);
          }}
          title="Pulsa para editar el título"
        >
          {nodex.title}
        </button>
      </h1>
    );
  }

  function finish(value: string) {
    if (cancelled.current) return;
    cancelled.current = true;
    setEditing(false);
    const title = value.trim();
    if (title && title !== nodex.title) save({ changes: { title } });
  }

  return (
    <Input
      autoFocus
      defaultValue={nodex.title}
      maxLength={200}
      aria-label="Título"
      className="h-auto py-1 text-3xl font-semibold md:text-3xl"
      onBlur={(event) => finish(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter") finish(event.currentTarget.value);
        if (event.key === "Escape") {
          cancelled.current = true;
          setEditing(false);
        }
      }}
    />
  );
}

function LinkProperty({ nodex }: { nodex: Nodex }) {
  const { save } = useSave(nodex);
  const refreshLink = useRefreshLink();
  const setReadLater = useSetReadLater();
  const [editing, setEditing] = useState(false);
  const cancelled = useRef(false);
  const edit = () => {
    cancelled.current = false;
    setEditing(true);
  };

  function finishUrl(value: string) {
    if (cancelled.current) return;
    cancelled.current = true;
    setEditing(false);
    const url = value.trim() || null;
    if (url !== nodex.url) save({ changes: { url } });
  }
  const broken = nodex.linkPreview?.status === "broken" || nodex.linkPreview?.status === "unreachable";

  return (
    <div className="grid gap-2">
      {editing ? (
        <Input
          autoFocus
          type="url"
          defaultValue={nodex.url ?? ""}
          placeholder="https://…"
          aria-label="Enlace"
          onBlur={(event) => finishUrl(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") finishUrl(event.currentTarget.value);
            if (event.key === "Escape") {
              cancelled.current = true;
              setEditing(false);
            }
          }}
        />
      ) : (
        <div className="flex min-w-0 items-center gap-2">
          {nodex.url ? (
            <a href={nodex.url} target="_blank" rel="noreferrer" className="truncate text-primary hover:underline">
              {domainOf(nodex.url)}
            </a>
          ) : (
            <button type="button" className="text-muted-foreground hover:text-foreground" onClick={edit}>
              Añadir enlace…
            </button>
          )}
          {nodex.url && (
            <Button variant="ghost" size="icon-sm" aria-label="Editar enlace" onClick={edit}>
              <Pencil />
            </Button>
          )}
        </div>
      )}
      {nodex.type === "link" && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Button
            variant={nodex.readLaterAt ? "default" : "outline"}
            size="sm"
            disabled={setReadLater.isPending}
            onClick={() =>
              setReadLater.mutate(
                { id: nodex.id, readLater: !nodex.readLaterAt },
                { onError: (error) => toast.error(error.message) },
              )
            }
          >
            {setReadLater.isPending && <Spinner />}
            {nodex.readLaterAt ? "Marcar como leído" : "Leer más tarde"}
          </Button>
          {nodex.linkPreview?.readingMinutes && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Clock className="size-3.5" aria-hidden="true" /> {nodex.linkPreview.readingMinutes} min de lectura
            </span>
          )}
        </div>
      )}
      {broken && nodex.url && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-2 text-sm">
          <span className="font-medium text-destructive">{nodex.linkPreview!.status === "broken" ? "Enlace roto" : "No responde"}</span>
          <Button
            variant="outline"
            size="sm"
            disabled={refreshLink.isPending}
            onClick={() =>
              refreshLink.mutate(nodex.id, {
                onSuccess: ({ preview }) => toast(preview.status === "ok" ? "El enlace vuelve a funcionar" : "El enlace sigue sin funcionar"),
              })
            }
          >
            {refreshLink.isPending && <Spinner />} Comprobar ahora
          </Button>
          {nodex.linkPreview!.archiveUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={nodex.linkPreview!.archiveUrl} target="_blank" rel="noreferrer">
                Ver copia
              </a>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function Properties({ nodex }: { nodex: Nodex }) {
  const { save } = useSave(nodex);
  const [wantsReminder, setWantsReminder] = useState(false);
  const reminderOn = wantsReminder || Boolean(nodex.reminder);
  const task = nodex.task && { status: nodex.task.status, dueAt: nodex.task.dueAt };

  return (
    <dl className="divide-y rounded-2xl border bg-card px-4">
      <Property label="Enlace">
        <LinkProperty nodex={nodex} />
      </Property>
      <Property label="Prioridad">
        <PrioritySelect value={nodex.priority} onChange={(priority) => priority !== nodex.priority && save({ changes: { priority } })} />
      </Property>
      <Property label="Tarea">
        <div className="grid gap-2">
          <div className="flex items-center gap-3">
            <Switch
              checked={task !== null}
              labelledBy="prop-task"
              onChange={() => save({ task: task ? null : { status: "todo", dueAt: null } })}
            />
            <span id="prop-task" className="text-sm text-muted-foreground">
              {task ? "Es una tarea" : "No es una tarea"}
            </span>
          </div>
          {task && <TaskStatusSelect value={task.status} onChange={(status) => status !== task.status && save({ task: { ...task, status } })} />}
        </div>
      </Property>
      {task && (
        <Property label="Fecha límite">
          <DueDateInput id="prop-due" task={task} onChange={(next) => complete(next.dueAt) && next.dueAt !== task.dueAt && save({ task: next })} />
        </Property>
      )}
      <Property label="Recordatorio">
        <div className="grid gap-2">
          <div className="flex items-center gap-3">
            <Switch
              checked={reminderOn}
              labelledBy="prop-reminder"
              onChange={() => {
                setWantsReminder(!reminderOn);
                if (reminderOn && nodex.reminder) save({ reminder: null });
              }}
            />
            <span id="prop-reminder" className="text-sm text-muted-foreground">
              {nodex.reminder ? formatDateTime(nodex.reminder.remindAt) : "Sin recordatorio"}
              {nodex.reminder?.sentAt && " · avisado"}
            </span>
          </div>
          {reminderOn && (
            <ReminderInput
              id="prop-remind-at"
              value={nodex.reminder?.remindAt ?? null}
              onChange={(remindAt) => remindAt && complete(remindAt) && remindAt !== nodex.reminder?.remindAt && save({ reminder: remindAt })}
            />
          )}
        </div>
      </Property>
      <Property label="Grupos">
        <GroupToggles
          value={nodex.groupIds}
          onToggle={(id) =>
            save({ groupIds: nodex.groupIds.includes(id) ? nodex.groupIds.filter((g) => g !== id) : [...nodex.groupIds, id] })
          }
        />
      </Property>
      <Property label="Etiquetas">
        <TagInput value={nodex.tags} onChange={(tags) => save({ changes: { tags } })} />
      </Property>
      <Property label="Creado">
        <span className="text-sm">{formatDateTime(nodex.createdAt)}</span>
      </Property>
      <Property label="Modificado">
        <span className="text-sm">{formatDateTime(nodex.updatedAt)}</span>
      </Property>
    </dl>
  );
}

function Content({ nodex, startEditing, readOnly }: { nodex: Nodex; startEditing: boolean; readOnly: boolean }) {
  const update = useUpdateNodex();
  const [editing, setEditing] = useState(startEditing);
  const [draft, setDraft] = useState(nodex.content ?? "");
  const [status, setStatus] = useState<"saved" | "saving" | "dirty">("saved");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef({ draft, saved: nodex.content ?? "" });

  function flush() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const { draft: text, saved } = latest.current;
    if (text === saved) return setStatus("saved");
    latest.current.saved = text;
    const previous = saved;
    setStatus("saving");
    update.mutate(
      { id: nodex.id, changes: { content: text.trim() ? text : null }, groupIds: nodex.groupIds, previousGroupIds: nodex.groupIds },
      {
        onSuccess: () => setStatus(latest.current.draft === text ? "saved" : "dirty"),
        onError: () => {
          latest.current.saved = previous;
          setStatus("dirty");
        },
      },
    );
  }

  const flushRef = useRef(flush);
  useEffect(() => {
    flushRef.current = flush;
  });
  useEffect(() => () => flushRef.current(), []);

  function change(text: string) {
    setDraft(text);
    latest.current.draft = text;
    setStatus("dirty");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, AUTOSAVE_MS);
  }

  function stopEditing() {
    flush();
    setEditing(false);
  }

  const shown = editing ? draft : (nodex.content ?? "");

  return (
    <section aria-label="Contenido" className="grid gap-2">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">Contenido</h2>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {editing && (
            <span role="status">{status === "saving" ? "Guardando…" : status === "dirty" ? "Sin guardar" : "Guardado"}</span>
          )}
          {readOnly && <span>Edítalo en el panel izquierdo</span>}
          <Button
            variant={editing ? "default" : "outline"}
            size="sm"
            className={cn(readOnly && "hidden")}
            onClick={() => {
              if (editing) return stopEditing();
              setDraft(nodex.content ?? "");
              latest.current = { draft: nodex.content ?? "", saved: nodex.content ?? "" };
              setEditing(true);
            }}
          >
            {editing ? "Listo" : "Editar"}
          </Button>
        </div>
      </div>
      {editing ? (
        <Textarea
          autoFocus
          value={draft}
          onChange={(event) => change(event.target.value)}
          onBlur={flush}
          onKeyDown={(event) => event.key === "Escape" && stopEditing()}
          aria-label="Contenido en Markdown"
          placeholder="Escribe en Markdown: # Título, **negrita**, - listas, [enlace](https://…)"
          className="min-h-80 font-mono text-sm"
          maxLength={50_000}
        />
      ) : shown.trim() ? (
        <div onDoubleClick={() => !readOnly && setEditing(true)} className="rounded-2xl border bg-card p-5">
          <Markdown>{shown}</Markdown>
        </div>
      ) : (
        <button
          type="button"
          disabled={readOnly}
          onClick={() => setEditing(true)}
          className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground enabled:hover:bg-muted"
        >
          {readOnly ? "Sin contenido" : "Pulsa para escribir…"}
        </button>
      )}
    </section>
  );
}

function NodexPane({ id, side, startEditing, readOnly = false }: { id: string; side: Side; startEditing: boolean; readOnly?: boolean }) {
  const router = useRouter();
  const nodex = useNodex(id);
  const related = useRelated(id);
  const deleteNodex = useDeleteNodex();
  const undoDelete = useUndoDelete();
  const { mutate: markOpened } = useMarkOpened();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const openNodex = useOpenNodex();
  const missing = nodex.error instanceof ApiError && nodex.error.status === 404;

  useEffect(() => {
    markOpened(id);
  }, [id, markOpened]);

  function open(target: string, mode: OpenTarget) {
    if (mode === "right") return openRight(target);
    if (side === "right") return showInRight(target, mode === "newTab");
    openNodex(target, mode);
  }

  function back() {
    if (window.history.length > 1) router.back();
    else router.push("/");
  }

  function remove() {
    deleteNodex.mutate(id, {
      onSuccess: () => {
        toast.success("Enviado a la papelera", { action: { label: "Deshacer", onClick: () => undoDelete("nodexs", id) } });
        if (side === "right") closeTab("right", id);
        else router.push("/");
      },
      onError: () => toast.error("No se ha podido borrar. Inténtalo de nuevo"),
    });
  }

  return (
    <div className="flex min-w-0 flex-col gap-5 pt-4">
      <div className="flex items-center gap-1">
        {side === "left" && (
          <Button variant="ghost" size="sm" onClick={back}>
            <ArrowLeft /> Volver
          </Button>
        )}
        {nodex.data && (
          <div className="ml-auto flex items-center gap-1">
            {nodex.data.url && (
              <Button variant="ghost" size="icon-sm" asChild>
                <a href={nodex.data.url} target="_blank" rel="noreferrer" aria-label="Abrir enlace" title="Abrir enlace">
                  <ExternalLink />
                </a>
              </Button>
            )}
            {side === "left" && (
              <Button
                variant="ghost"
                size="icon-sm"
                className="hidden md:inline-flex"
                aria-label="Abrir a la derecha"
                title="Abrir a la derecha"
                onClick={() => openRight(id)}
              >
                <SquareSplitHorizontal />
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Más acciones">
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {side === "left" && (
                  <DropdownMenuItem className="hidden md:flex" onSelect={() => openRight(id)}>
                    <SquareSplitHorizontal /> Abrir a la derecha
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem variant="destructive" onSelect={() => setConfirmDelete(true)}>
                  Borrar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {nodex.isPending && <Spinner className="mx-auto my-12 size-8 text-primary" />}
      {missing && (
        <div className="grid justify-items-center gap-3 py-12 text-center">
          <p className="text-muted-foreground">Este Nodex ya no existe</p>
          {side === "left" ? (
            <Button variant="outline" onClick={() => router.push("/")}>
              Volver al panel
            </Button>
          ) : (
            <Button variant="outline" onClick={() => closeTab("right", id)}>
              Cerrar
            </Button>
          )}
        </div>
      )}
      {nodex.isError && !missing && (
        <div className="grid justify-items-center gap-3 py-12 text-center">
          <p className="text-muted-foreground">No se ha podido cargar el Nodex</p>
          <Button variant="outline" onClick={() => nodex.refetch()}>
            Reintentar
          </Button>
        </div>
      )}

      {nodex.data && (
        <article className="grid gap-6" key={nodex.data.id}>
          <Title key={nodex.data.title} nodex={nodex.data} />
          <Properties nodex={nodex.data} />
          <Content nodex={nodex.data} startEditing={startEditing} readOnly={readOnly} />

          {related.data && related.data.length > 0 && (
            <section className="grid gap-2">
              <h2 className="text-sm font-medium text-muted-foreground">Relacionados</h2>
              <ul className="grid gap-1">
                {related.data.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={(event) => open(item.id, openTarget(event))}
                      onMouseDown={preventMiddleScroll}
                      onAuxClick={(event) => event.button === 1 && open(item.id, "newTab")}
                      className="w-full rounded-lg px-2 py-1.5 text-left hover:bg-muted"
                    >
                      <span className="font-medium">{item.title}</span>
                      {item.url && <span className="ml-2 text-xs text-muted-foreground">{domainOf(item.url)}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <ConfirmDialog
            open={confirmDelete}
            onOpenChange={setConfirmDelete}
            title="¿Borrar este Nodex?"
            description="Se enviará a la papelera."
            onConfirm={remove}
          />
        </article>
      )}
    </div>
  );
}

type SeparatorProps = {
  container: React.RefObject<HTMLDivElement | null>;
  split: number;
  onPreview: (value: number | null) => void;
};

function PaneSeparator({ container, split, onPreview }: SeparatorProps) {
  const live = useRef<number | null>(null);

  function finish() {
    if (live.current !== null) setSplit(live.current);
    live.current = null;
    onPreview(null);
  }

  function keyTo(event: React.KeyboardEvent, value: number) {
    event.preventDefault();
    setSplit(value);
  }

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Ancho de los paneles"
      aria-controls="panel-izquierdo"
      aria-valuenow={Math.round(split)}
      aria-valuemin={25}
      aria-valuemax={75}
      tabIndex={0}
      title="Arrastra para cambiar el ancho · doble clic: 50 %"
      className="group hidden w-4 shrink-0 cursor-col-resize touch-none justify-center self-stretch outline-none select-none md:flex"
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (!event.currentTarget.hasPointerCapture(event.pointerId) || !container.current) return;
        const rect = container.current.getBoundingClientRect();
        live.current = clampSplit(((event.clientX - rect.left) / rect.width) * 100);
        onPreview(live.current);
      }}
      onPointerUp={finish}
      onLostPointerCapture={finish}
      onDoubleClick={() => setSplit(50)}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") keyTo(event, split - 5);
        if (event.key === "ArrowRight") keyTo(event, split + 5);
        if (event.key === "Home") keyTo(event, 25);
        if (event.key === "End") keyTo(event, 75);
      }}
    >
      <span className="h-full w-px bg-border transition-colors group-hover:bg-primary group-focus-visible:bg-primary" />
    </div>
  );
}

export function NodexView({ id }: { id: string }) {
  const params = useSearchParams();
  const [startEditing] = useState(params.get("editar") === "1");

  useEffect(() => {
    showInTabs(id);
  }, [id]);

  useEffect(() => {
    if (startEditing) window.history.replaceState(null, "", `/nodexs/${id}`);
  }, [id, startEditing]);

  return (
    <>
      <NodexTabs side="left" />
      <NodexPane id={id} side="left" startEditing={startEditing} />
    </>
  );
}

export function NodexSplit({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { left, right, split } = useTabs();
  const nodex = useNodex(left.active ?? undefined);
  const container = useRef<HTMLDivElement>(null);
  const [preview, setPreview] = useState<number | null>(null);
  const rightId = right?.active ?? null;

  function back() {
    if (window.history.length > 1) router.back();
    else router.push("/");
  }

  return (
    <div className={cn("mx-auto flex w-full min-w-0 flex-col gap-4", rightId ? "max-w-7xl" : "max-w-3xl")}>
      <TopBar icon={LayoutGrid} location="Panel" crumb={nodex.data ? { label: nodex.data.title, onClear: back } : undefined} />
      <div ref={container} className="flex min-w-0 items-start">
        <section
          id="panel-izquierdo"
          aria-label={rightId ? "Panel izquierdo" : undefined}
          style={{ "--split": `${preview ?? split}%` } as React.CSSProperties}
          className={cn("min-w-0 flex-1", rightId && "md:flex-none md:basis-(--split)")}
        >
          {children}
        </section>
        {rightId && (
          <>
            <PaneSeparator container={container} split={preview ?? split} onPreview={setPreview} />
            <section aria-label="Panel derecho" className="hidden min-w-0 flex-1 md:block">
              <NodexTabs side="right" />
              <NodexPane key={rightId} id={rightId} side="right" startEditing={false} readOnly={rightId === left.active} />
            </section>
          </>
        )}
      </div>
    </div>
  );
}
