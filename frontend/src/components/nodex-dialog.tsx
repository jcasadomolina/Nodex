"use client";

import { Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { TagInput } from "@/components/tag-input";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api";
import {
  domainOf,
  formatDateTime,
  fromDateInput,
  fromDateTimeInput,
  looksLikeUrl,
  PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  toDateInput,
  toDateTimeInput,
} from "@/lib/format";
import { useRefreshLink } from "@/lib/queries/alerts";
import { useUndoDelete } from "@/lib/queries/trash";
import { useGroups } from "@/lib/queries/groups";
import {
  useCreateNodex,
  useDeleteNodex,
  useMarkOpened,
  useNodex,
  useRelated,
  useSetReadLater,
  useUpdateNodex,
  type NodexInput,
} from "@/lib/queries/nodexs";
import type { Nodex, NodexMatch, Priority, TaskInput, TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const PRIORITIES: (Priority | null)[] = [null, "low", "medium", "high", "urgent"];

const toggleClass = "h-8 rounded-full border px-3 text-sm transition-colors";

function toggleState(active: boolean) {
  return active ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted";
}

function Switch({ checked, labelledBy, onChange }: { checked: boolean; labelledBy: string; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      onClick={onChange}
      className={cn(
        "relative h-6 w-11 rounded-full transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        checked ? "bg-primary" : "bg-muted-foreground/30",
      )}
    >
      <span className={cn("absolute top-1 left-1 size-4 rounded-full bg-white transition-transform", checked && "translate-x-5")} />
    </button>
  );
}

function atHour(daysFromToday: number, hour: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  date.setHours(hour, 0, 0, 0);
  return date;
}

const REMINDER_SHORTCUTS = [
  { label: "En 1 hora", at: () => new Date(Math.ceil(Date.now() / 60_000) * 60_000 + 3_600_000) },
  { label: "Esta tarde (18:00)", at: () => (atHour(0, 18) > new Date() ? atHour(0, 18) : atHour(1, 18)) },
  { label: "Mañana a las 9:00", at: () => atHour(1, 9) },
];

function showSaveError(error: Error) {
  if (!(error instanceof ApiError) || error.status === 0 || error.status >= 500) {
    toast.error("No se ha podido guardar. Inténtalo de nuevo");
  }
}

function NodexList({ nodexs, onOpen }: { nodexs: Nodex[]; onOpen: (id: string) => void }) {
  return (
    <ul className="grid gap-1">
      {nodexs.map((nodex) => (
        <li key={nodex.id}>
          <button type="button" onClick={() => onOpen(nodex.id)} className="w-full rounded-lg px-2 py-1.5 text-left hover:bg-muted">
            <span className="font-medium">{nodex.title}</span>
            {nodex.url && <span className="ml-2 text-xs text-muted-foreground">{domainOf(nodex.url)}</span>}
          </button>
        </li>
      ))}
    </ul>
  );
}

type NodexFormProps = {
  nodex?: Nodex;
  defaultTask?: boolean;
  onDone: () => void;
  onOpenNodex: (id: string) => void;
};

function NodexForm({ nodex, defaultTask = false, onDone, onOpenNodex }: NodexFormProps) {
  const groups = useGroups();
  const related = useRelated(nodex?.id);
  const createNodex = useCreateNodex();
  const updateNodex = useUpdateNodex();
  const deleteNodex = useDeleteNodex();

  const [title, setTitle] = useState(nodex?.title ?? "");
  const [url, setUrl] = useState(nodex?.url ?? "");
  const [content, setContent] = useState(nodex?.content ?? "");
  const [priority, setPriority] = useState<Priority | null>(nodex?.priority ?? null);
  const [groupIds, setGroupIds] = useState<string[]>(nodex?.groupIds ?? []);
  const [tags, setTags] = useState<string[]>(nodex?.tags ?? []);
  const [reminderOn, setReminderOn] = useState(Boolean(nodex?.reminder));
  const [remindAt, setRemindAt] = useState<string | null>(nodex?.reminder?.remindAt ?? null);
  const refreshLink = useRefreshLink();
  const setReadLater = useSetReadLater();
  const undoDelete = useUndoDelete();
  const [readLater, setReadLaterOnCreate] = useState(false);
  const [task, setTask] = useState<TaskInput | null>(
    nodex?.task ? { status: nodex.task.status, dueAt: nodex.task.dueAt } : defaultTask ? { status: "todo", dueAt: null } : null,
  );
  const [created, setCreated] = useState<{ id: string; duplicates: NodexMatch[] } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const mutation = nodex ? updateNodex : createNodex;
  const failure = mutation.error;
  const error = failure instanceof ApiError && failure.status >= 400 && failure.status < 500 && failure.status !== 401 ? failure : null;

  function toggleGroup(id: string) {
    setGroupIds((ids) => (ids.includes(id) ? ids.filter((g) => g !== id) : [...ids, id]));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const input = { title: title.trim(), url: url.trim() || null, content: content.trim() || null, priority, groupIds, tags };

    if (nodex) {
      const changes: Partial<Omit<NodexInput, "type">> = Object.fromEntries(
        (["title", "url", "content", "priority"] as const)
          .filter((key) => input[key] !== nodex[key])
          .map((key) => [key, input[key]]),
      );
      if (tags.join() !== nodex.tags.join()) changes.tags = tags;
      const reminderChange = !reminderOn
        ? nodex.reminder
          ? null
          : undefined
        : remindAt && remindAt !== nodex.reminder?.remindAt
          ? remindAt
          : undefined;
      const taskChanged = task?.status !== nodex.task?.status || task?.dueAt !== nodex.task?.dueAt;
      updateNodex.mutate(
        { id: nodex.id, changes, groupIds, previousGroupIds: nodex.groupIds, task: taskChanged ? task : undefined, reminder: reminderChange },
        {
          onSuccess: () => {
            toast.success("Cambios guardados");
            onDone();
          },
          onError: showSaveError,
        },
      );
      return;
    }

    createNodex.mutate(
      { type: input.url ? "link" : "note", ...input, readLater: Boolean(input.url) && readLater, task: task ?? undefined, reminder: reminderOn && remindAt ? remindAt : undefined },
      {
        onSuccess: ({ nodex: saved, duplicates }) => {
          if (duplicates.length > 0) {
            setCreated({ id: saved.id, duplicates });
            return;
          }
          toast.success("Nodex creado");
          onDone();
        },
        onError: showSaveError,
      },
    );
  }

  function remove(id: string, message: string) {
    deleteNodex.mutate(id, {
      onSuccess: () => {
        toast.success(message, { action: { label: "Deshacer", onClick: () => undoDelete("nodexs", id) } });
        onDone();
      },
      onError: () => toast.error("No se ha podido borrar. Inténtalo de nuevo"),
    });
  }

  if (created) {
    return (
      <div className="grid gap-4">
        <p className="rounded-lg bg-primary/15 p-3">Ya tienes algo muy parecido:</p>
        <NodexList nodexs={created.duplicates} onOpen={onOpenNodex} />
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="destructive" onClick={() => remove(created.id, "Nodex borrado")} disabled={deleteNodex.isPending}>
            {deleteNodex.isPending && <Spinner />}
            Borrar el que acabo de crear
          </Button>
          <Button onClick={onDone}>Mantener los dos</Button>
        </div>
      </div>
    );
  }

  function fieldError(name: string) {
    const message = error?.fields[name]?.[0];
    return message && <p className="text-sm text-destructive">{message}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="nodex-title">Título</Label>
        <Input
          id="nodex-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onPaste={(event) => {
            const text = event.clipboardData.getData("text").trim();
            if (looksLikeUrl(text) && !url) {
              event.preventDefault();
              setUrl(text);
            }
          }}
          required
          maxLength={200}
          placeholder="Escribe un título o pega un enlace"
        />
        {fieldError("title")}
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="nodex-url">Enlace</Label>
        <Input id="nodex-url" type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://…" />
        {fieldError("url")}
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="nodex-content">Contenido</Label>
        <Textarea id="nodex-content" value={content} onChange={(event) => setContent(event.target.value)} rows={5} />
        {fieldError("content")}
      </div>

      <fieldset className="grid gap-1.5">
        <legend className="mb-1.5 text-sm font-medium">Prioridad</legend>
        <div className="flex flex-wrap gap-2">
          {PRIORITIES.map((value) => (
            <button
              key={value ?? "none"}
              type="button"
              aria-pressed={priority === value}
              onClick={() => setPriority(value)}
              className={cn(toggleClass, toggleState(priority === value))}
            >
              {value ? PRIORITY_LABELS[value] : "Sin prioridad"}
            </button>
          ))}
        </div>
      </fieldset>

      <div role="group" aria-labelledby="nodex-task" className="grid gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium" id="nodex-task">
            Tarea
          </span>
          <Switch checked={task !== null} labelledBy="nodex-task" onChange={() => setTask(task ? null : { status: "todo", dueAt: null })} />
        </div>
        {task && (
          <div className="grid gap-3">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(TASK_STATUS_LABELS) as TaskStatus[]).map((status) => (
                <button
                  key={status}
                  type="button"
                  aria-pressed={task.status === status}
                  onClick={() => setTask({ ...task, status })}
                  className={cn(toggleClass, toggleState(task.status === status))}
                >
                  {TASK_STATUS_LABELS[status]}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="nodex-due">Fecha límite</Label>
              <Input
                id="nodex-due"
                type="date"
                value={task.dueAt ? toDateInput(task.dueAt) : ""}
                onChange={(event) => setTask({ ...task, dueAt: event.target.value ? fromDateInput(event.target.value) : null })}
                className="w-auto"
              />
              {task.dueAt && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setTask({ ...task, dueAt: null })}>
                  Quitar fecha
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      <div role="group" aria-labelledby="nodex-reminder" className="grid gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium" id="nodex-reminder">
            Recordatorio
          </span>
          <Switch checked={reminderOn} labelledBy="nodex-reminder" onChange={() => setReminderOn(!reminderOn)} />
        </div>
        {reminderOn && (
          <div className="grid gap-3">
            <div className="flex flex-wrap gap-2">
              {REMINDER_SHORTCUTS.map(({ label, at }) => (
                <button key={label} type="button" onClick={() => setRemindAt(at().toISOString())} className={cn(toggleClass, "hover:bg-muted")}>
                  {label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Label htmlFor="nodex-remind-at">Avisarme el</Label>
              <Input
                id="nodex-remind-at"
                type="datetime-local"
                value={remindAt ? toDateTimeInput(remindAt) : ""}
                onChange={(event) => setRemindAt(event.target.value ? fromDateTimeInput(event.target.value) : null)}
                className="w-auto"
              />
            </div>
            {nodex?.reminder && remindAt === nodex.reminder.remindAt && new Date(remindAt) <= new Date() && (
              <p className="text-sm text-muted-foreground">
                {nodex.reminder.sentAt ? `Avisado el ${formatDateTime(remindAt)}. Elige otra fecha para volver a avisarte.` : "Pendiente de aviso."}
              </p>
            )}
            {fieldError("remindAt")}
          </div>
        )}
      </div>

      {nodex?.type === "link" && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Button
            type="button"
            variant={nodex.readLaterAt ? "default" : "outline"}
            size="sm"
            disabled={setReadLater.isPending}
            onClick={() =>
              setReadLater.mutate(
                { id: nodex.id, readLater: !nodex.readLaterAt },
                {
                  onSuccess: () => toast.success(nodex.readLaterAt ? "Marcado como leído" : "Guardado para leer más tarde"),
                  onError: (error) => toast.error(error.message),
                },
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

      {!nodex && url.trim() && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium" id="nodex-read-later">
            Leer más tarde
          </span>
          <Switch checked={readLater} labelledBy="nodex-read-later" onChange={() => setReadLaterOnCreate(!readLater)} />
        </div>
      )}

      {nodex?.url && (nodex.linkPreview?.status === "broken" || nodex.linkPreview?.status === "unreachable") && (
        <div className="grid gap-2 rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm">
          <p className="font-medium text-destructive">
            {nodex.linkPreview.status === "broken" ? "Este enlace está roto" : "Este enlace no responde"}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" disabled={refreshLink.isPending} onClick={() =>
                refreshLink.mutate(nodex.id, {
                  onSuccess: ({ preview }) => toast(preview.status === "ok" ? "El enlace vuelve a funcionar" : "El enlace sigue sin funcionar"),
                })
              }>
              {refreshLink.isPending && <Spinner />} Comprobar ahora
            </Button>
            {nodex.linkPreview.archiveUrl && (
              <Button type="button" variant="outline" size="sm" asChild>
                <a href={nodex.linkPreview.archiveUrl} target="_blank" rel="noreferrer">
                  Ver copia
                </a>
              </Button>
            )}
          </div>
        </div>
      )}

      {groups.data && groups.data.length > 0 && (
        <fieldset className="grid gap-1.5">
          <legend className="mb-1.5 text-sm font-medium">Grupos</legend>
          <div className="flex flex-wrap gap-2">
            {groups.data.map((group) => (
              <button
                key={group.id}
                type="button"
                aria-pressed={groupIds.includes(group.id)}
                onClick={() => toggleGroup(group.id)}
                className={cn(toggleClass, toggleState(groupIds.includes(group.id)))}
              >
                {group.name}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <div className="grid gap-1.5">
        <Label htmlFor="nodex-tags">Etiquetas</Label>
        <TagInput value={tags} onChange={setTags} />
        {fieldError("tags")}
      </div>

      {error && <p className="text-sm text-destructive">{error.message}</p>}

      <div className="flex flex-wrap justify-end gap-2">
        {nodex && (
          <Button type="button" variant="destructive" className="mr-auto" onClick={() => setConfirmDelete(true)}>
            Borrar
          </Button>
        )}
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <Spinner />}
          {nodex ? "Guardar" : "Crear"}
        </Button>
      </div>

      {related.data && related.data.length > 0 && (
        <section className="grid gap-2 border-t pt-4">
          <h3 className="font-medium">Relacionados</h3>
          <NodexList nodexs={related.data} onOpen={onOpenNodex} />
        </section>
      )}

      {nodex && (
        <ConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          title="¿Borrar este Nodex?"
          description="Se enviará a la papelera."
          onConfirm={() => remove(nodex.id, "Enviado a la papelera")}
        />
      )}
    </form>
  );
}

type NodexDialogProps = {
  id: string | null;
  defaultTask?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenNodex: (id: string) => void;
};

export function NodexDialog({ id, defaultTask, open, onOpenChange, onOpenNodex }: NodexDialogProps) {
  const nodex = useNodex(id ?? undefined);
  const { mutate: markOpened } = useMarkOpened();

  useEffect(() => {
    if (open && id) markOpened(id);
  }, [open, id, markOpened]);
  const missing = nodex.error instanceof ApiError && nodex.error.status === 404;
  const close = () => onOpenChange(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{id ? "Nodex" : "Nuevo Nodex"}</DialogTitle>
          <DialogDescription className="sr-only">{id ? "Ver y editar el Nodex" : "Crear una nota o un enlace"}</DialogDescription>
        </DialogHeader>
        {!id && <NodexForm key="new" defaultTask={defaultTask} onDone={close} onOpenNodex={onOpenNodex} />}
        {id && missing && <p className="text-muted-foreground">Este Nodex ya no existe.</p>}
        {id && nodex.isPending && <Spinner className="mx-auto my-8 size-8 text-primary" />}
        {id && nodex.data && <NodexForm key={nodex.data.id} nodex={nodex.data} onDone={close} onOpenNodex={onOpenNodex} />}
      </DialogContent>
    </Dialog>
  );
}
