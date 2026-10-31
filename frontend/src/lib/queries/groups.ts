import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import type { Group } from "../types";
import { useInvalidateNodexs } from "./nodexs";

export function useGroups() {
  return useQuery({
    queryKey: ["groups"],
    queryFn: async () => (await api<{ groups: Group[] }>("/groups")).groups,
  });
}

function useGroupMutation<T>(mutationFn: (input: T) => Promise<unknown>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["groups"] }),
  });
}

export function useCreateGroup() {
  return useGroupMutation((input: { name: string }) => api<{ group: Group }>("/groups", { method: "POST", body: input }));
}

export function useRenameGroup() {
  return useGroupMutation(({ id, name }: { id: string; name: string }) =>
    api<{ group: Group }>(`/groups/${id}`, { method: "PATCH", body: { name } }),
  );
}

export function useDeleteGroup() {
  const invalidate = useInvalidateNodexs();

  return useMutation({
    mutationFn: (id: string) => api<void>(`/groups/${id}`, { method: "DELETE" }),
    onSuccess: () => invalidate(),
  });
}
