"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { toast } from "sonner";
import { Spinner } from "@/components/spinner";
import { TopBar } from "@/components/top-bar";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { Profile } from "@/lib/types";

const PROVIDERS = [
  { id: "google", name: "Google" },
  { id: "github", name: "GitHub" },
] as const;

function LinkNotice() {
  const params = useSearchParams();

  useEffect(() => {
    const linked = PROVIDERS.find((p) => p.id === params.get("linked"));
    const failed = PROVIDERS.find((p) => p.id === params.get("error"));
    if (linked) toast.success(`Cuenta de ${linked.name} vinculada`);
    if (failed) toast.error(`No se ha podido vincular la cuenta de ${failed.name}`);
  }, [params]);

  return null;
}

export default function ProfilePage() {
  const profile = useQuery({
    queryKey: ["profile"],
    queryFn: async () => (await api<{ user: Profile }>("/me")).user,
  });

  return (
    <>
      <TopBar location="Perfil" />
      <Suspense>
        <LinkNotice />
      </Suspense>
      {profile.isPending && <Spinner className="mx-auto mt-16 size-8 text-primary" />}
      {profile.data && (
        <section className="mx-auto mt-8 grid w-full max-w-md gap-6 rounded-2xl border bg-card p-6">
          <div>
            <h1 className="text-xl font-semibold">{profile.data.name}</h1>
            <p className="text-muted-foreground">{profile.data.email}</p>
          </div>
          <div className="grid gap-3">
            <h2 className="font-medium">Cuentas vinculadas</h2>
            {PROVIDERS.map(({ id, name }) => (
              <div key={id} className="flex items-center justify-between">
                <span>{name}</span>
                {profile.data.providers.includes(id) ? (
                  <span className="text-sm text-muted-foreground">Vinculada</span>
                ) : (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/api/auth/${id}/link`}>Vincular</a>
                  </Button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
