import { useIsMutating, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "../api";
import type { Suggestion } from "../types";
import { useInvalidateNodexs } from "./nodexs";

const SUGGESTIONS_KEY = ["nodexs", "suggestions"];
const REFRESH_KEY = ["suggestions", "refresh"];

export function useSuggestions() {
  return useQuery({
    queryKey: SUGGESTIONS_KEY,
    queryFn: async () => (await api<{ suggestions: Suggestion[] }>("/suggestions")).suggestions,
  });
}

export function useResolveSuggestion() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateNodexs();

  return useMutation({
    mutationFn: ({ suggestion, accept }: { suggestion: Suggestion; accept: boolean }) =>
      api<void>(`/suggestions/${suggestion.id}/${accept ? "accept" : "reject"}`, { method: "POST" }),
    onSuccess: (_data, { suggestion, accept }) => {
      queryClient.setQueryData<Suggestion[]>(SUGGESTIONS_KEY, (list) => list?.filter((s) => s.id !== suggestion.id));
      if (accept) toast.success(`Añadido a «${suggestion.group.name}»`);
    },
    onError: (error) => toast.error(error.message),
    onSettled: (_data, _error, { suggestion }) => invalidate(suggestion.nodex.id),
  });
}

export function useRefreshSuggestions() {
  const invalidate = useInvalidateNodexs();

  return useMutation({
    mutationKey: REFRESH_KEY,
    mutationFn: () => api<{ reviewed: number; pending: number }>("/suggestions/refresh", { method: "POST" }),
    onMutate: () => {
      toast.loading("Revisando huérfanos…", { id: "refresh-suggestions" });
    },
    onSuccess: async ({ reviewed, pending }) => {
      await invalidate();
      const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
      const text = `Revisados: ${plural(reviewed, "huérfano")} · ${plural(pending, "sugerencia")}`;
      toast.success(text, { id: "refresh-suggestions" });
    },
    onError: (error) => toast.error(error.message, { id: "refresh-suggestions" }),
  });
}

export function useRefreshing() {
  return useIsMutating({ mutationKey: REFRESH_KEY }) > 0;
}
