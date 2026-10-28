import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "../api";
import type { BrokenLink, LinkPreview, ReminderItem } from "../types";
import { useInvalidateNodexs } from "./nodexs";

export function useDueReminders() {
  return useQuery({
    queryKey: ["alerts", "due"],
    queryFn: async () => (await api<{ reminders: ReminderItem[] }>("/reminders?status=due")).reminders,
    refetchInterval: 60_000,
  });
}

export function useUpcomingReminders(enabled: boolean) {
  return useQuery({
    queryKey: ["alerts", "upcoming"],
    queryFn: async () => (await api<{ reminders: ReminderItem[] }>("/reminders?status=upcoming")).reminders,
    enabled,
  });
}

export function useBrokenLinks(enabled: boolean) {
  return useQuery({
    queryKey: ["alerts", "broken"],
    queryFn: async () => (await api<{ links: BrokenLink[] }>("/links/broken")).links,
    enabled,
  });
}

export function useDismissReminder() {
  const invalidate = useInvalidateNodexs();

  return useMutation({
    mutationFn: (nodexId: string) => api(`/reminders/${nodexId}/dismiss`, { method: "POST" }),
    onError: (error) => toast.error(error.message),
    onSettled: (_data, _error, nodexId) => invalidate(nodexId),
  });
}

export function useRefreshLink() {
  const invalidate = useInvalidateNodexs();

  return useMutation({
    mutationFn: (nodexId: string) => api<{ preview: LinkPreview }>(`/links/${nodexId}/refresh`, { method: "POST" }),
    onError: (error) => toast.error(error.message),
    onSettled: (_data, _error, nodexId) => invalidate(nodexId),
  });
}
