import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import type { Group } from "../types";

export function useGroups() {
  return useQuery({
    queryKey: ["groups"],
    queryFn: async () => (await api<{ groups: Group[] }>("/groups")).groups,
  });
}

function useGroupMutation<T>(mutationFn: (input: T) => Promise<unknown>, alsoNodexs = false) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      if (alsoNodexs) queryClient.invalidateQueries({ queryKey: ["nodexs"] });
    },
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
  return useGroupMutation((id: string) => api<void>(`/groups/${id}`, { method: "DELETE" }), true);
}
