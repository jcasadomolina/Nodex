import { useQuery } from "@tanstack/react-query";
import { api } from "../api";

export function useTags() {
  return useQuery({
    queryKey: ["tags"],
    queryFn: async () => (await api<{ tags: { name: string; nodexCount: number }[] }>("/tags")).tags,
  });
}
