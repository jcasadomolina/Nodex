import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "../api";
import type { Profile, User } from "../types";

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => (await api<{ user: User }>("/auth/me")).user,
  });
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => (await api<{ user: Profile }>("/me")).user,
  });
}

function useProfileMutation<T>(mutationFn: (input: T) => Promise<unknown>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSettled: () => Promise.all([queryClient.invalidateQueries({ queryKey: ["profile"] }), queryClient.invalidateQueries({ queryKey: ["me"] })]),
  });
}

export function useUpdateName() {
  return useProfileMutation((name: string) => api("/me", { method: "PATCH", body: { name } }));
}

export function useUploadAvatar() {
  return useProfileMutation((file: File) => {
    const form = new FormData();
    form.append("avatar", file);
    return api("/me/avatar", { method: "PUT", body: form });
  });
}

export function useRemoveAvatar() {
  return useProfileMutation(() => api("/me/avatar", { method: "DELETE" }));
}

export function useUnlinkProvider() {
  return useProfileMutation((provider: string) => api(`/me/providers/${provider}`, { method: "DELETE" }));
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

export function useStartDemo() {
  return useEnter("/auth/demo");
}

export function useConvertDemo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: Record<string, string>) =>
      (await api<{ user: User }>("/auth/demo/convert", { method: "POST", body })).user,
    onSuccess: (user) => {
      queryClient.setQueryData(["me"], user);
      return queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
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
