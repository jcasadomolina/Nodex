"use client";

import { MoreHorizontal, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCreateGroup, useDeleteGroup, useGroups, useRenameGroup } from "@/lib/queries/groups";
import type { BoardFilter, Group } from "@/lib/types";
import { cn } from "@/lib/utils";

type GroupFilterProps = {
  value: BoardFilter;
  onChange: (filter: BoardFilter) => void;
};

const chipClass = "flex h-8 shrink-0 items-center gap-1 rounded-full border px-3 text-sm transition-colors";

function chipState(active: boolean) {
  return active ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted";
}

function NameInput({ initial, onSubmit, onCancel }: { initial: string; onSubmit: (name: string) => void; onCancel: () => void }) {
  return (
    <input
      autoFocus
      defaultValue={initial}
      aria-label="Nombre del grupo"
      placeholder="Nombre del grupo"
      maxLength={80}
      onBlur={onCancel}
      onKeyDown={(event) => {
        const name = event.currentTarget.value.trim();
        if (event.key === "Enter" && name) onSubmit(name);
        if (event.key === "Escape") onCancel();
      }}
      className={cn(chipClass, "w-40 bg-card outline-none focus:border-primary")}
    />
  );
}

export function GroupFilter({ value, onChange }: GroupFilterProps) {
  const groups = useGroups();
  const createGroup = useCreateGroup();
  const renameGroup = useRenameGroup();
  const deleteGroup = useDeleteGroup();
  const [creating, setCreating] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Group | null>(null);

  const onError = (error: Error) => toast.error(error.message);

  function create(name: string) {
    createGroup.mutate({ name }, { onSuccess: () => setCreating(false), onError });
  }

  function rename(id: string, name: string) {
    renameGroup.mutate({ id, name }, { onSuccess: () => setRenamingId(null), onError });
  }

  function remove(group: Group) {
    deleteGroup.mutate(group.id, {
      onSuccess: () => {
        if (value.kind === "group" && value.groupId === group.id) onChange({ kind: "all" });
        toast.success("Grupo enviado a la papelera");
      },
      onError,
    });
  }

  return (
    <div data-tour="grupos" className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto py-1">
      <button type="button" className={cn(chipClass, chipState(value.kind === "all"))} onClick={() => onChange({ kind: "all" })}>
        Todos
      </button>
      <button
        type="button"
        className={cn(chipClass, chipState(value.kind === "orphans"))}
        onClick={() => onChange({ kind: "orphans" })}
      >
        Huérfanos
      </button>

      {groups.data?.map((group) => {
        if (renamingId === group.id) {
          return (
            <NameInput
              key={group.id}
              initial={group.name}
              onSubmit={(name) => rename(group.id, name)}
              onCancel={() => setRenamingId(null)}
            />
          );
        }

        const active = value.kind === "group" && value.groupId === group.id;
        return (
          <div key={group.id} className={cn(chipClass, chipState(active), "pr-1")}>
            <button type="button" onClick={() => onChange({ kind: "group", groupId: group.id })}>
              {group.name} <span className="opacity-60">{group.nodexCount}</span>
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger aria-label={`Opciones de ${group.name}`} className="rounded-full p-1 hover:bg-black/10">
                <MoreHorizontal className="size-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onSelect={() => setRenamingId(group.id)}>Renombrar</DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(group)}>
                  Borrar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      })}

      {creating ? (
        <NameInput initial="" onSubmit={create} onCancel={() => setCreating(false)} />
      ) : (
        <button type="button" data-tour="nuevo-grupo" className={cn(chipClass, "border-dashed bg-transparent hover:bg-muted")} onClick={() => setCreating(true)}>
          <Plus className="size-4" /> Grupo
        </button>
      )}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`¿Borrar el grupo «${deleting?.name}»?`}
        description="Los Nodexs del grupo no se borran."
        onConfirm={() => deleting && remove(deleting)}
      />
    </div>
  );
}
