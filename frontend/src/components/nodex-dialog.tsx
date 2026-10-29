"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { DueDateInput, GroupToggles, PrioritySelect, ReminderInput, Switch, TaskStatusSelect } from "@/components/nodex-fields";
import { Spinner } from "@/components/spinner";
import { TagInput } from "@/components/tag-input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api";
import { domainOf, looksLikeUrl } from "@/lib/format";
import { useCreateNodex, useDeleteNodex } from "@/lib/queries/nodexs";
import type { NodexMatch, Priority, TaskInput } from "@/lib/types";

function showSaveError(error: Error) {
  if (!(error instanceof ApiError) || error.status === 0 || error.status >= 500) {
    toast.error("No se ha podido guardar. Inténtalo de nuevo");
  }
}

function Duplicates({ id, duplicates, onOpen }: { id: string; duplicates: NodexMatch[]; onOpen: (id: string, edit?: boolean) => void }) {
  const deleteNodex = useDeleteNodex();

  return (
    <div className="grid gap-4">
      <p className="rounded-lg bg-primary/15 p-3">Ya tienes algo muy parecido:</p>
      <ul className="grid gap-1">
        {duplicates.map((nodex) => (
          <li key={nodex.id}>
            <button type="button" onClick={() => onOpen(nodex.id)} className="w-full rounded-lg px-2 py-1.5 text-left hover:bg-muted">
              <span className="font-medium">{nodex.title}</span>
              {nodex.url && <span className="ml-2 text-xs text-muted-foreground">{domainOf(nodex.url)}</span>}
            </button>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          variant="destructive"
          disabled={deleteNodex.isPending}
          onClick={() =>
            deleteNodex.mutate(id, {
              onSuccess: () => {
                toast.success("Nodex borrado");
                onOpen(duplicates[0]!.id);
              },
              onError: () => toast.error("No se ha podido borrar. Inténtalo de nuevo"),
            })
          }
        >
          {deleteNodex.isPending && <Spinner />}
          Borrar el que acabo de crear
        </Button>
        <Button onClick={() => onOpen(id, true)}>Mantener los dos</Button>
      </div>
    </div>
  );
}

function NewNodexForm({ defaultTask, onOpen }: { defaultTask: boolean; onOpen: (id: string, edit?: boolean) => void }) {
  const createNodex = useCreateNodex();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [priority, setPriority] = useState<Priority | null>(null);
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [task, setTask] = useState<TaskInput | null>(defaultTask ? { status: "todo", dueAt: null } : null);
  const [reminderOn, setReminderOn] = useState(false);
  const [remindAt, setRemindAt] = useState<string | null>(null);
  const [readLater, setReadLater] = useState(false);
  const [created, setCreated] = useState<{ id: string; duplicates: NodexMatch[] } | null>(null);

  const failure = createNodex.error;
  const error = failure instanceof ApiError && failure.status >= 400 && failure.status < 500 && failure.status !== 401 ? failure : null;

  if (created) return <Duplicates id={created.id} duplicates={created.duplicates} onOpen={onOpen} />;

  function fieldError(name: string) {
    const message = error?.fields[name]?.[0];
    return message && <p className="text-sm text-destructive">{message}</p>;
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const link = url.trim() || null;
    createNodex.mutate(
      {
        type: link ? "link" : "note",
        title: title.trim(),
        url: link,
        content: null,
        priority,
        groupIds,
        tags,
        readLater: Boolean(link) && readLater,
        task: task ?? undefined,
        reminder: reminderOn && remindAt ? remindAt : undefined,
      },
      {
        onSuccess: ({ nodex, duplicates }) => {
          if (duplicates.length > 0) return setCreated({ id: nodex.id, duplicates });
          toast.success("Nodex creado");
          onOpen(nodex.id, true);
        },
        onError: showSaveError,
      },
    );
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
          autoFocus
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

      <details className="rounded-xl border p-3">
        <summary className="cursor-pointer text-sm font-medium">Más opciones</summary>
        <div className="mt-4 grid gap-4">
          <fieldset className="grid gap-1.5">
            <legend className="mb-1.5 text-sm font-medium">Prioridad</legend>
            <PrioritySelect value={priority} onChange={setPriority} />
          </fieldset>

          <div role="group" aria-labelledby="new-task" className="grid gap-2">
            <div className="flex items-center justify-between">
              <span id="new-task" className="text-sm font-medium">
                Tarea
              </span>
              <Switch checked={task !== null} labelledBy="new-task" onChange={() => setTask(task ? null : { status: "todo", dueAt: null })} />
            </div>
            {task && (
              <>
                <TaskStatusSelect value={task.status} onChange={(status) => setTask({ ...task, status })} />
                <DueDateInput id="new-due" task={task} onChange={setTask} />
              </>
            )}
          </div>

          <div role="group" aria-labelledby="new-reminder" className="grid gap-2">
            <div className="flex items-center justify-between">
              <span id="new-reminder" className="text-sm font-medium">
                Recordatorio
              </span>
              <Switch checked={reminderOn} labelledBy="new-reminder" onChange={() => setReminderOn(!reminderOn)} />
            </div>
            {reminderOn && <ReminderInput id="new-remind-at" value={remindAt} onChange={setRemindAt} />}
          </div>

          {url.trim() && (
            <div className="flex items-center justify-between">
              <span id="new-read-later" className="text-sm font-medium">
                Leer más tarde
              </span>
              <Switch checked={readLater} labelledBy="new-read-later" onChange={() => setReadLater(!readLater)} />
            </div>
          )}

          <fieldset className="grid gap-1.5">
            <legend className="mb-1.5 text-sm font-medium">Grupos</legend>
            <GroupToggles value={groupIds} onToggle={(id) => setGroupIds((ids) => (ids.includes(id) ? ids.filter((g) => g !== id) : [...ids, id]))} />
          </fieldset>

          <div className="grid gap-1.5">
            <Label htmlFor="nodex-tags">Etiquetas</Label>
            <TagInput value={tags} onChange={setTags} />
            {fieldError("tags")}
          </div>
        </div>
      </details>

      {error && <p className="text-sm text-destructive">{error.message}</p>}

      <div className="flex justify-end">
        <Button type="submit" disabled={createNodex.isPending}>
          {createNodex.isPending && <Spinner />}
          Crear
        </Button>
      </div>
    </form>
  );
}

type NodexDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTask?: boolean;
};

export function NodexDialog({ open, onOpenChange, defaultTask = false }: NodexDialogProps) {
  const router = useRouter();

  function openNodex(id: string, edit = false) {
    onOpenChange(false);
    router.push(`/nodexs/${id}${edit ? "?editar=1" : ""}`);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Nuevo Nodex</DialogTitle>
          <DialogDescription>El contenido lo escribirás en la página del Nodex, al crearlo.</DialogDescription>
        </DialogHeader>
        {open && <NewNodexForm defaultTask={defaultTask} onOpen={openNodex} />}
      </DialogContent>
    </Dialog>
  );
}
