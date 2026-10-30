"use client";

import { useState } from "react";
import { ConvertDialog } from "@/components/convert-dialog";
import { Button } from "@/components/ui/button";
import { useMe } from "@/lib/queries/auth";

const HOUR = 60 * 60 * 1000;

export function DemoBanner() {
  const me = useMe();
  const [now] = useState(() => Date.now());
  const [open, setOpen] = useState(false);
  const expiresAt = me.data?.demoExpiresAt;

  if (!expiresAt) return null;

  const hours = Math.ceil((new Date(expiresAt).getTime() - now) / HOUR);
  const left = hours <= 1 ? "menos de 1 h" : `${hours} h`;

  return (
    <div className="mx-auto mb-3 flex w-full max-w-2xl items-center justify-between gap-3 rounded-2xl bg-primary/15 px-4 py-2 text-sm">
      <p>
        <span className="hidden md:inline">Estás en la demo · se borra en {left}</span>
        <span className="md:hidden">Demo · {left}</span>
      </p>
      <Button size="sm" onClick={() => setOpen(true)}>
        Crear cuenta
      </Button>
      <ConvertDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
