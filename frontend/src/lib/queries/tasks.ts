import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "../api";
import type { TaskCard, TaskStatus } from "../types";
import { useInvalidateNodexs } from "./nodexs";

export function useTaskBoard() {
  return useQuery({
    queryKey: ["tasks", "board"],
    queryFn: async () => (await api<{ columns: Record<TaskStatus, TaskCard[]> }>("/tasks/board")).columns,
  });
}

export function useTaskCalendar(from: Date, to: Date) {
  return useQuery({
    queryKey: ["tasks", "calendar", from.toISOString()],
    queryFn: async () => {
      const params = new URLSearchParams({ from: from.toISOString(), to: to.toISOString() });
      return (await api<{ tasks: TaskCard[] }>(`/tasks/calendar?${params}`)).tasks;
    },
  });
}

export function useMoveTask() {
  const invalidate = useInvalidateNodexs();

  return useMutation({
    mutationFn: ({ nodexId, status, index }: { nodexId: string; status: TaskStatus; index: number }) =>
      api(`/tasks/${nodexId}/move`, { method: "POST", body: { status, index } }),
    onError: (error) => toast.error(error.message),
    onSettled: (_data, _error, { nodexId }) => invalidate(nodexId),
  });
}
