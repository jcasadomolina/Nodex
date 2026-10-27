"use client";

import { useState } from "react";
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
import { domainOf, looksLikeUrl, PRIORITY_LABELS } from "@/lib/format";
import { useGroups } from "@/lib/queries/groups";
import { useCreateNodex, useDeleteNodex, useNodex, useRelated, useUpdateNodex, type NodexInput } from "@/lib/queries/nodexs";
import type { Nodex, NodexMatch, Priority } from "@/lib/types";
import { cn } from "@/lib/utils";

const PRIORITIES: (Priority | null)[] = [null, "low", "medium", "high", "urgent"];

const toggleClass = "h-8 rounded-full border px-3 text-sm transition-colors";

function toggleState(active: boolean) {
  return active ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted";
}

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
  onDone: () => void;
  onOpenNodex: (id: string) => void;
};

function NodexForm({ nodex, onDone, onOpenNodex }: NodexFormProps) {
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
      updateNodex.mutate(
        { id: nodex.id, changes, groupIds, previousGroupIds: nodex.groupIds },
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
      { type: input.url ? "link" : "note", ...input },
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
        toast.success(message);
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenNodex: (id: string) => void;
};

export function NodexDialog({ id, open, onOpenChange, onOpenNodex }: NodexDialogProps) {
  const nodex = useNodex(id ?? undefined);
  const missing = nodex.error instanceof ApiError && nodex.error.status === 404;
  const close = () => onOpenChange(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{id ? "Nodex" : "Nuevo Nodex"}</DialogTitle>
          <DialogDescription className="sr-only">{id ? "Ver y editar el Nodex" : "Crear una nota o un enlace"}</DialogDescription>
        </DialogHeader>
        {!id && <NodexForm key="new" onDone={close} onOpenNodex={onOpenNodex} />}
        {id && missing && <p className="text-muted-foreground">Este Nodex ya no existe.</p>}
        {id && nodex.isPending && <Spinner className="mx-auto my-8 size-8 text-primary" />}
        {id && nodex.data && <NodexForm key={nodex.data.id} nodex={nodex.data} onDone={close} onOpenNodex={onOpenNodex} />}
      </DialogContent>
    </Dialog>
  );
}
