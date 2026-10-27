import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
import type { Group, Nodex } from "../types";

export function useBoard() {
  return useQuery({
    queryKey: ["nodexs", "board"],
    queryFn: () => api<{ groups: Group[]; nodexs: Nodex[] }>("/board"),
  });
}

export function useRelatedPairs(enabled: boolean) {
  return useQuery({
    queryKey: ["related", "pairs"],
    queryFn: async () => (await api<{ pairs: { a: string; b: string }[] }>("/board/related")).pairs,
    enabled,
  });
}
