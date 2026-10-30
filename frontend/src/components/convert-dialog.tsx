"use client";

import { toast } from "sonner";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api";
import { useConvertDemo } from "@/lib/queries/auth";

type ConvertDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ConvertDialog({ open, onOpenChange }: ConvertDialogProps) {
  const convert = useConvertDemo();
  const error = convert.error instanceof ApiError ? convert.error : null;
  const emailError = error?.fields.email?.[0] ?? (error?.status === 409 ? error.message : null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    convert.mutate(data, {
      onSuccess: () => {
        toast.success("Cuenta creada. Tus Nodexs se quedan");
        onOpenChange(false);
      },
    });
  }

  function fieldError(message: string | null | undefined) {
    return message && <p className="text-sm text-destructive">{message}</p>;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crea tu cuenta</DialogTitle>
          <DialogDescription>Tus Nodexs se quedan</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="convert-name">Nombre</Label>
            <Input id="convert-name" name="name" required autoComplete="name" maxLength={80} aria-invalid={Boolean(error?.fields.name)} />
            {fieldError(error?.fields.name?.[0])}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="convert-email">Correo electrónico</Label>
            <Input id="convert-email" name="email" type="email" required autoComplete="email" aria-invalid={Boolean(emailError)} />
            {fieldError(emailError)}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="convert-password">Contraseña</Label>
            <Input
              id="convert-password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              minLength={8}
              aria-invalid={Boolean(error?.fields.password)}
              aria-describedby="convert-password-hint"
            />
            <p id="convert-password-hint" className="text-xs text-muted-foreground">
              Mínimo 8 caracteres
            </p>
            {fieldError(error?.fields.password?.[0])}
          </div>
          {error && !emailError && !Object.keys(error.fields).length && <p className="text-sm text-destructive">{error.message}</p>}
          <Button type="submit" size="lg" disabled={convert.isPending}>
            {convert.isPending && <Spinner />}
            Crear cuenta
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
