"use client";

import { ArrowLeft, Clock, ExternalLink, LayoutGrid, MoreHorizontal, Pencil } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Markdown } from "@/components/markdown";
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
import type { Nodex, TaskInput } from "@/lib/types";

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

function Content({ nodex, startEditing }: { nodex: Nodex; startEditing: boolean }) {
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
          <Button
            variant={editing ? "default" : "outline"}
            size="sm"
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
        <div onDoubleClick={() => setEditing(true)} className="rounded-2xl border bg-card p-5">
          <Markdown>{shown}</Markdown>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground hover:bg-muted"
        >
          Pulsa para escribir…
        </button>
      )}
    </section>
  );
}

export function NodexView({ id }: { id: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const nodex = useNodex(id);
  const related = useRelated(id);
  const deleteNodex = useDeleteNodex();
  const undoDelete = useUndoDelete();
  const { mutate: markOpened } = useMarkOpened();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const missing = nodex.error instanceof ApiError && nodex.error.status === 404;

  useEffect(() => {
    markOpened(id);
  }, [id, markOpened]);

  const [startEditing] = useState(params.get("editar") === "1");

  useEffect(() => {
    if (startEditing) window.history.replaceState(null, "", `/nodexs/${id}`);
  }, [id, startEditing]);

  function back() {
    if (window.history.length > 1) router.back();
    else router.push("/");
  }

  function remove() {
    deleteNodex.mutate(id, {
      onSuccess: () => {
        toast.success("Enviado a la papelera", { action: { label: "Deshacer", onClick: () => undoDelete("nodexs", id) } });
        router.push("/");
      },
      onError: () => toast.error("No se ha podido borrar. Inténtalo de nuevo"),
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl min-w-0 flex-col gap-5">
      <TopBar icon={LayoutGrid} location="Panel" crumb={nodex.data ? { label: nodex.data.title, onClear: back } : undefined} />

      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={back}>
          <ArrowLeft /> Volver
        </Button>
        {nodex.data && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Más acciones">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {nodex.data.url && (
                <DropdownMenuItem asChild>
                  <a href={nodex.data.url} target="_blank" rel="noreferrer">
                    <ExternalLink /> Abrir enlace
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem variant="destructive" onSelect={() => setConfirmDelete(true)}>
                Borrar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {nodex.isPending && <Spinner className="mx-auto my-12 size-8 text-primary" />}
      {missing && (
        <div className="grid justify-items-center gap-3 py-12 text-center">
          <p className="text-muted-foreground">Este Nodex ya no existe</p>
          <Button variant="outline" onClick={() => router.push("/")}>
            Volver al panel
          </Button>
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
          <Content nodex={nodex.data} startEditing={startEditing} />

          {related.data && related.data.length > 0 && (
            <section className="grid gap-2">
              <h2 className="text-sm font-medium text-muted-foreground">Relacionados</h2>
              <ul className="grid gap-1">
                {related.data.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => router.push(`/nodexs/${item.id}`)}
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
