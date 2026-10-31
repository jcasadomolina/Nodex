import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, ApiError } from "../api";
import type { BoardFilter, Nodex, NodexMatch, NodexResult, Priority, TaskInput } from "../types";

export type NodexQuery = {
  filter: BoardFilter;
  sort: "recent" | "priority";
  priority: Priority | null;
};

export type NodexInput = {
  type: "note" | "link";
  title: string;
  content: string | null;
  url: string | null;
  priority: Priority | null;
  tags: string[];
  readLater?: boolean;
  source?: "manual" | "share";
};

function listParams({ filter, sort, priority }: NodexQuery, cursor?: string) {
  const params = new URLSearchParams({ sort, limit: "50" });
  if (filter.kind === "group") params.set("groupId", filter.groupId);
  if (filter.kind === "orphans") params.set("orphan", "true");
  if (filter.kind === "readLater") params.set("readLater", "true");
  if (priority) params.set("priority", priority);
  if (cursor) params.set("cursor", cursor);
  return params;
}

export function useNodexs(query: NodexQuery) {
  return useInfiniteQuery({
    queryKey: ["nodexs", query],
    queryFn: ({ pageParam }) =>
      api<{ nodexs: Nodex[]; nextCursor: string | null }>(`/nodexs?${listParams(query, pageParam)}`),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.nextCursor ?? undefined,
  });
}

export function useNodex(id: string | undefined) {
  return useQuery({
    queryKey: ["nodex", id],
    queryFn: async () => (await api<{ nodex: Nodex }>(`/nodexs/${id}`)).nodex,
    enabled: Boolean(id),
  });
}

export function useRelated(id: string | undefined) {
  return useQuery({
    queryKey: ["related", id],
    queryFn: async () => (await api<{ nodexs: NodexMatch[] }>(`/nodexs/${id}/related`)).nodexs,
    enabled: Boolean(id),
  });
}

export function useReadLaterCount() {
  return useQuery({
    queryKey: ["nodexs", "read-later-count"],
    queryFn: async () => (await api<{ count: number }>("/nodexs/read-later/count")).count,
  });
}

export function useSetReadLater() {
  const invalidate = useInvalidateNodexs();

  return useMutation({
    mutationFn: ({ id, readLater }: { id: string; readLater: boolean }) =>
      api<{ nodex: Nodex }>(`/nodexs/${id}`, { method: "PATCH", body: { readLater } }),
    onSettled: (_data, _error, { id }) => invalidate(id),
  });
}

export function useRediscover(enabled: boolean) {
  return useQuery({
    queryKey: ["nodexs", "rediscover"],
    queryFn: async () => (await api<{ nodexs: Nodex[] }>("/nodexs/rediscover")).nodexs,
    enabled,
  });
}

export function useMarkOpened() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api<void>(`/nodexs/${id}/open`, { method: "POST" }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["nodexs", "rediscover"] }),
  });
}

export function useSearch(q: string) {
  return useQuery({
    queryKey: ["search", q],
    queryFn: async () => (await api<{ nodexs: NodexResult[] }>(`/nodexs/search?q=${encodeURIComponent(q)}`)).nodexs,
    enabled: q.length > 0,
  });
}

export function useInvalidateNodexs() {
  const queryClient = useQueryClient();

  return (id?: string) =>
    Promise.all(
      [["nodexs"], ["groups"], ["search"], ["related"], ["tags"], ["tasks"], ["alerts"], ["trash"], ...(id ? [["nodex", id]] : [])].map((queryKey) =>
        queryClient.invalidateQueries({ queryKey }),
      ),
    );
}

export function useCreateNodex() {
  const invalidate = useInvalidateNodexs();

  return useMutation({
    mutationFn: async ({ task, reminder, ...input }: NodexInput & { groupIds: string[]; task?: TaskInput; reminder?: string }) => {
      const result = await api<{ nodex: Nodex; duplicates: NodexMatch[] }>("/nodexs", { method: "POST", body: input });
      if (task) {
        await api(`/tasks/${result.nodex.id}`, { method: "PUT", body: task }).catch(() =>
          toast.error("Nodex creado, pero no se ha podido guardar la tarea"),
        );
      }
      if (reminder) {
        await api(`/reminders/${result.nodex.id}`, { method: "PUT", body: { remindAt: reminder } }).catch((error: Error) => {
          const reason = error instanceof ApiError ? (error.fields.remindAt?.[0] ?? error.message) : error.message;
          toast.error(`Nodex creado, pero no se ha podido guardar el recordatorio: ${reason}`);
        });
      }
      return result;
    },
    onSettled: () => invalidate(),
  });
}

type NodexUpdate = {
  id: string;
  changes: Partial<Omit<NodexInput, "type">>;
  groupIds: string[];
  previousGroupIds: string[];
  task?: TaskInput | null;
  reminder?: string | null;
};

function applyUpdate(nodex: Nodex, { changes, groupIds, task, reminder }: NodexUpdate): Nodex {
  const fields = { ...changes };
  delete fields.readLater;
  return {
    ...nodex,
    ...fields,
    type: changes.url === undefined ? nodex.type : changes.url ? "link" : "note",
    groupIds,
    task: task === undefined ? nodex.task : task && { ...task, completedAt: nodex.task?.completedAt ?? null },
    reminder: reminder === undefined ? nodex.reminder : reminder ? { remindAt: reminder, sentAt: null, dismissedAt: null } : null,
  };
}

export function fieldMessage(error: Error) {
  if (!(error instanceof ApiError)) return "No se ha podido guardar";
  return Object.values(error.fields)[0]?.[0] ?? error.message;
}

export function useUpdateNodex() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateNodexs();

  return useMutation({
    scope: { id: "update-nodex" },
    onMutate: async (update: NodexUpdate) => {
      await queryClient.cancelQueries({ queryKey: ["nodex", update.id] });
      const previous = queryClient.getQueryData<Nodex>(["nodex", update.id]);
      if (previous) queryClient.setQueryData<Nodex>(["nodex", update.id], applyUpdate(previous, update));
      return { previous };
    },
    onError: (error, { id }, context) => {
      if (context?.previous) queryClient.setQueryData(["nodex", id], context.previous);
      toast.error(fieldMessage(error));
    },
    mutationFn: async ({ id, changes, groupIds, previousGroupIds, task, reminder }: NodexUpdate) => {
      if (Object.keys(changes).length > 0) await api(`/nodexs/${id}`, { method: "PATCH", body: changes });
      const added = groupIds.filter((g) => !previousGroupIds.includes(g));
      const removed = previousGroupIds.filter((g) => !groupIds.includes(g));
      await Promise.all([
        ...added.map((g) => api(`/groups/${g}/nodexs`, { method: "POST", body: { nodexId: id } })),
        ...removed.map((g) => api(`/groups/${g}/nodexs/${id}`, { method: "DELETE" })),
      ]);
      if (task === null) await api(`/tasks/${id}`, { method: "DELETE" });
      if (task) await api(`/tasks/${id}`, { method: "PUT", body: task });
      if (reminder === null) await api(`/reminders/${id}`, { method: "DELETE" });
      if (reminder) await api(`/reminders/${id}`, { method: "PUT", body: { remindAt: reminder } });
    },
    onSettled: (_data, _error, { id }) => invalidate(id),
  });
}

export function useDeleteNodex() {
  const invalidate = useInvalidateNodexs();

  return useMutation({
    mutationFn: (id: string) => api<void>(`/nodexs/${id}`, { method: "DELETE" }),
    onSuccess: (_data, id) => invalidate(id),
  });
}
