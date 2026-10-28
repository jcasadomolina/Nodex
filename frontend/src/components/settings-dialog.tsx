"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLogout, useMe } from "@/lib/queries/auth";

const THEMES = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Oscuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Monitor },
];

type SettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { theme, setTheme } = useTheme();
  const logout = useLogout();
  const me = useMe();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajustes</DialogTitle>
          <DialogDescription>Preferencias de la aplicación</DialogDescription>
        </DialogHeader>

        <section className="grid gap-2">
          <h3 className="font-medium">Tema</h3>
          <div className="grid grid-cols-3 gap-2">
            {THEMES.map(({ value, label, icon: Icon }) => (
              <Button
                key={value}
                variant={theme === value ? "default" : "outline"}
                aria-pressed={theme === value}
                onClick={() => setTheme(value)}
              >
                <Icon />
                {label}
              </Button>
            ))}
          </div>
        </section>

        <div className="grid gap-2 border-t pt-4">
          <Button variant="outline" className="h-auto justify-start py-2" asChild>
            <Link href="/perfil" onClick={() => onOpenChange(false)}>
              {me.data && <Avatar name={me.data.name} url={me.data.avatarUrl} className="size-8" />}
              <span className="grid text-left">
                <span>{me.data?.name ?? "Perfil"}</span>
                <span className="text-xs font-normal text-muted-foreground">Ver y editar tu perfil</span>
              </span>
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/bienvenida" onClick={() => onOpenChange(false)}>
              Ver la bienvenida otra vez
            </Link>
          </Button>
          <Button variant="destructive" onClick={() => logout.mutate()} disabled={logout.isPending}>
            {logout.isPending && <Spinner />}
            Cerrar sesión
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
