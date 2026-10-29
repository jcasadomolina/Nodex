"use client";

import { UserRound } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Avatar } from "@/components/avatar";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Spinner } from "@/components/spinner";
import { TopBar } from "@/components/top-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api";
import { useProfile, useRemoveAvatar, useUnlinkProvider, useUpdateName, useUploadAvatar } from "@/lib/queries/auth";
import type { Profile } from "@/lib/types";

const PROVIDERS = [
  { id: "google", name: "Google" },
  { id: "github", name: "GitHub" },
] as const;

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const onError = (error: Error) => toast.error(error.message);

function LinkNotice() {
  const params = useSearchParams();

  useEffect(() => {
    const linked = PROVIDERS.find((p) => p.id === params.get("linked"));
    const failed = PROVIDERS.find((p) => p.id === params.get("error"));
    if (linked) toast.success(`Cuenta de ${linked.name} vinculada`, { id: "link-notice" });
    if (failed) toast.error(`No se ha podido vincular la cuenta de ${failed.name}`, { id: "link-notice" });
    if (linked || failed) window.history.replaceState(null, "", "/perfil");
  }, [params]);

  return null;
}

function PhotoSection({ profile }: { profile: Profile }) {
  const upload = useUploadAvatar();
  const remove = useRemoveAvatar();
  const input = useRef<HTMLInputElement>(null);
  const changeButton = useRef<HTMLButtonElement>(null);
  const busy = upload.isPending || remove.isPending;

  function choose(file: File | undefined) {
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) return toast.error("Elige una imagen JPG, PNG, WebP o GIF");
    if (file.size > MAX_IMAGE_BYTES) return toast.error("La imagen no puede pesar más de 5 MB");
    upload.mutate(file, { onSuccess: () => toast.success("Foto actualizada"), onError });
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative" aria-busy={busy}>
        <Avatar name={profile.name} url={profile.avatarUrl} className="size-20 text-3xl" />
        {busy && (
          <span className="absolute inset-0 grid place-content-center rounded-full bg-black/40">
            <Spinner className="size-6 text-white" />
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <input
          ref={input}
          type="file"
          accept={IMAGE_TYPES.join(",")}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(event) => {
            choose(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        <Button ref={changeButton} variant="outline" size="sm" disabled={busy} onClick={() => input.current?.click()}>
          Cambiar foto
        </Button>
        {profile.avatarUrl && (
          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() =>
              remove.mutate(undefined, {
                onSuccess: () => {
                  toast.success("Foto quitada");
                  changeButton.current?.focus();
                },
                onError,
              })
            }
          >
            Quitar foto
          </Button>
        )}
      </div>
    </div>
  );
}

function NameSection({ profile }: { profile: Profile }) {
  const update = useUpdateName();
  const [name, setName] = useState(profile.name);
  const changed = name.trim() !== profile.name && name.trim() !== "";
  const fieldError = update.error instanceof ApiError ? (update.error.fields.name?.[0] ?? update.error.message) : update.error?.message;

  return (
    <form
      className="grid gap-1.5"
      onSubmit={(event) => {
        event.preventDefault();
        update.mutate(name.trim(), { onSuccess: () => toast.success("Nombre guardado") });
      }}
    >
      <Label htmlFor="profile-name">Nombre</Label>
      <div className="flex gap-2">
        <Input id="profile-name" value={name} onChange={(event) => {
            setName(event.target.value);
            update.reset();
          }} maxLength={80} required />
        <Button type="submit" disabled={!changed || update.isPending}>
          {update.isPending && <Spinner />} Guardar
        </Button>
      </div>
      {fieldError && <p className="text-sm text-destructive">{fieldError}</p>}
    </form>
  );
}

function AccountsSection({ profile }: { profile: Profile }) {
  const unlink = useUnlinkProvider();
  const [confirming, setConfirming] = useState<(typeof PROVIDERS)[number] | null>(null);
  const onlyMethod = !profile.hasPassword && profile.providers.length === 1;

  return (
    <div className="grid gap-3">
      <h2 className="font-medium">Cuentas vinculadas</h2>
      {PROVIDERS.map((provider) => (
        <div key={provider.id} className="flex items-center justify-between gap-3">
          <span>{provider.name}</span>
          {profile.providers.includes(provider.id) ? (
            <Button
              variant="outline"
              size="sm"
              disabled={onlyMethod || unlink.isPending}
              onClick={() => setConfirming(provider)}
            >
              {unlink.isPending && unlink.variables === provider.id && <Spinner />} Desvincular
            </Button>
          ) : (
            <Button variant="outline" size="sm" asChild>
              <a href={`/api/auth/${provider.id}/link`}>Vincular</a>
            </Button>
          )}
        </div>
      ))}
      {onlyMethod && (
        <p className="text-sm text-muted-foreground">No puedes desvincular tu único método de inicio de sesión. Vincula otra cuenta antes.</p>
      )}
      <ConfirmDialog
        open={confirming !== null}
        onOpenChange={(open) => !open && setConfirming(null)}
        title={`¿Desvincular ${confirming?.name ?? "la cuenta"}?`}
        description="Ya no podrás iniciar sesión con esa cuenta hasta que la vuelvas a vincular."
        confirmLabel="Desvincular"
        onConfirm={() =>
          confirming &&
          unlink.mutate(confirming.id, { onSuccess: () => toast.success(`Cuenta de ${confirming.name} desvinculada`), onError })
        }
      />
    </div>
  );
}

export default function ProfilePage() {
  const profile = useProfile();

  return (
    <>
      <TopBar icon={UserRound} location="Perfil" />
      <Suspense>
        <LinkNotice />
      </Suspense>
      {profile.isPending && <Spinner className="mx-auto mt-16 size-8 text-primary" />}
      {profile.isError && !profile.data && (
        <div className="mt-16 grid justify-items-center gap-3 text-center">
          <p className="text-muted-foreground">No se ha podido cargar el perfil</p>
          <Button variant="outline" onClick={() => profile.refetch()}>
            Reintentar
          </Button>
        </div>
      )}
      {profile.data && (
        <section className="mx-auto mt-8 grid w-full max-w-md gap-6 rounded-2xl border bg-card p-6">
          <h1 className="sr-only">Perfil</h1>
          <PhotoSection profile={profile.data} />
          <NameSection key={profile.data.name} profile={profile.data} />
          <div className="grid gap-1.5">
            <span className="text-sm font-medium">Correo</span>
            <p className="text-muted-foreground">{profile.data.email}</p>
          </div>
          <AccountsSection profile={profile.data} />
        </section>
      )}
    </>
  );
}
