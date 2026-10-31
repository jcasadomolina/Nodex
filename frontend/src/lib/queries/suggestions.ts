import { useIsMutating, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "../api";
import type { NewGroupProposal, Suggestion } from "../types";
import { useInvalidateNodexs } from "./nodexs";

const SUGGESTIONS_KEY = ["nodexs", "suggestions"];
const REFRESH_KEY = ["suggestions", "refresh"];

type SuggestionsData = { suggestions: Suggestion[]; newGroups: NewGroupProposal[] };

export function useSuggestions() {
  return useQuery({
    queryKey: SUGGESTIONS_KEY,
    queryFn: () => api<SuggestionsData>("/suggestions"),
  });
}

export function useResolveSuggestion() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateNodexs();

  return useMutation({
    mutationFn: ({ suggestion, accept }: { suggestion: Suggestion; accept: boolean }) =>
      api<void>(`/suggestions/${suggestion.id}/${accept ? "accept" : "reject"}`, { method: "POST" }),
    onSuccess: (_data, { suggestion, accept }) => {
      queryClient.setQueryData<SuggestionsData>(
        SUGGESTIONS_KEY,
        (data) => data && { ...data, suggestions: data.suggestions.filter((s) => s.id !== suggestion.id) },
      );
      if (accept) toast.success(`Añadido a «${suggestion.group.name}»`);
    },
    onError: (error) => toast.error(error.message),
    onSettled: (_data, _error, { suggestion }) => invalidate(suggestion.nodex.id),
  });
}

export function useResolveNewGroup() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateNodexs();

  return useMutation({
    mutationFn: ({ name, groupName }: { name: string; groupName: string | null }) =>
      groupName === null
        ? api<void>("/suggestions/new-groups/reject", { method: "POST", body: { name } })
        : api("/suggestions/new-groups/accept", { method: "POST", body: { name, groupName } }),
    onSuccess: (_data, { name, groupName }) => {
      queryClient.setQueryData<SuggestionsData>(
        SUGGESTIONS_KEY,
        (data) => data && { ...data, newGroups: data.newGroups.filter((g) => g.name !== name) },
      );
      if (groupName !== null) toast.success(`Grupo «${groupName}» creado`);
    },
    onError: (error) => toast.error(error.message),
    onSettled: () => invalidate(),
  });
}

export function useRefreshSuggestions() {
  const invalidate = useInvalidateNodexs();

  return useMutation({
    mutationKey: REFRESH_KEY,
    mutationFn: () => api<{ reviewed: number; pending: number; newGroups: number }>("/suggestions/refresh", { method: "POST" }),
    onMutate: () => {
      toast.loading("Revisando huérfanos…", { id: "refresh-suggestions" });
    },
    onSuccess: async ({ reviewed, pending, newGroups }) => {
      await invalidate();
      const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
      const text = [
        `Revisados: ${plural(reviewed, "huérfano", "huérfanos")}`,
        plural(pending, "sugerencia", "sugerencias"),
        plural(newGroups, "grupo nuevo", "grupos nuevos"),
      ].join(" · ");
      toast.success(text, { id: "refresh-suggestions" });
    },
    onError: (error) => toast.error(error.message, { id: "refresh-suggestions" }),
  });
}

export function useRefreshing() {
  return useIsMutating({ mutationKey: REFRESH_KEY }) > 0;
}
