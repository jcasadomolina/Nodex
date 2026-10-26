import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "../api";
import type { User } from "../types";

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => (await api<{ user: User }>("/auth/me")).user,
  });
}

function useEnter(path: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (body: Record<string, string>) =>
      (await api<{ user: User }>(path, { method: "POST", body })).user,
    onSuccess: (user) => {
      queryClient.setQueryData(["me"], user);
      router.replace("/");
    },
  });
}

export function useLogin() {
  return useEnter("/auth/login");
}

export function useRegister() {
  return useEnter("/auth/register");
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: () => api<void>("/auth/logout", { method: "POST" }),
    onSuccess: () => {
      queryClient.clear();
      router.replace("/login");
    },
  });
}
