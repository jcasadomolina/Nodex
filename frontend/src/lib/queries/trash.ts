import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, ApiError } from "../api";
import { useInvalidateNodexs } from "./nodexs";

export type TrashKind = "nodexs" | "groups";

export type TrashItem = { id: string; name: string; deletedAt: string; nodexCount?: number };

type TrashResponse = {
  nodexs: { id: string; title: string; type: "note" | "link"; deletedAt: string }[];
  groups: { id: string; name: string; deletedAt: string; nodexCount: number }[];
};

export function useTrash() {
  return useQuery({
    queryKey: ["trash"],
    queryFn: async () => {
      const data = await api<TrashResponse>("/trash");
      return {
        nodexs: data.nodexs.map(({ title, ...n }): TrashItem => ({ ...n, name: title })),
        groups: data.groups as TrashItem[],
      };
    },
  });
}

function restore(kind: TrashKind, id: string) {
  return api<{ group?: { name: string } } | undefined>(`/trash/${kind}/${id}/restore`, { method: "POST" });
}

function restoredMessage(result: { group?: { name: string } } | undefined) {
  return result?.group ? `Grupo «${result.group.name}» restaurado` : "Restaurado";
}

export function useRestore() {
  const invalidate = useInvalidateNodexs();

  return useMutation({
    mutationFn: ({ kind, id }: { kind: TrashKind; id: string }) => restore(kind, id),
    onSuccess: (result) => toast.success(restoredMessage(result)),
    onError: (error) => toast.error(error.message),
    onSettled: () => invalidate(),
  });
}

export function useDeleteForever() {
  const invalidate = useInvalidateNodexs();

  return useMutation({
    mutationFn: ({ kind, id }: { kind: TrashKind; id: string }) => api<void>(`/trash/${kind}/${id}`, { method: "DELETE" }),
    onSuccess: () => toast.success("Eliminado para siempre"),
    onError: (error) => toast.error(error.message),
    onSettled: () => invalidate(),
  });
}

export function useEmptyTrash() {
  const invalidate = useInvalidateNodexs();

  return useMutation({
    mutationFn: () => api<{ nodexs: number; groups: number }>("/trash", { method: "DELETE" }),
    onSuccess: () => toast.success("Papelera vaciada"),
    onError: (error) => toast.error(error.message),
    onSettled: () => invalidate(),
  });
}

export function useUndoDelete() {
  const invalidate = useInvalidateNodexs();

  return (kind: TrashKind, id: string) =>
    restore(kind, id)
      .then((result) => toast.success(restoredMessage(result)))
      .catch((error: Error) =>
        toast.error(error instanceof ApiError && error.status === 404 ? "Ya no está en la papelera" : error.message),
      )
      .finally(() => invalidate(kind === "nodexs" ? id : undefined));
}
