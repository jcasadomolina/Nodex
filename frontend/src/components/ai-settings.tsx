"use client";

import { Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { startAi } from "@/components/ai-prompt";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { deleteModel, disableAi, useAiStatus } from "@/lib/ai/ai";

export function AiSettings() {
  const status = useAiStatus();
  const [deleting, setDeleting] = useState(false);

  async function remove() {
    setDeleting(true);
    try {
      await deleteModel();
      toast.success("Modelo borrado de este dispositivo");
    } catch {
      toast.error("No se ha podido borrar el modelo");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="grid gap-2">
      <p className="text-sm text-muted-foreground">
        {status.state === "ready" ? "Lista" : "Se descarga una sola vez (~120 MB). Tus notas no salen del dispositivo para esto."}
      </p>
      <Button
        variant="outline"
        aria-pressed={status.state !== "off"}
        disabled={status.state === "loading"}
        onClick={status.state === "off" ? startAi : disableAi}
      >
        {status.state === "loading" ? <Spinner /> : <Sparkles />}
        {status.state === "loading" ? `Descargando… ${status.progress} %` : status.state === "ready" ? "Desactivar la IA" : "Activar la IA"}
      </Button>
      {status.state === "off" && (
        <Button variant="ghost" onClick={remove} disabled={deleting}>
          {deleting ? <Spinner /> : <Trash2 />} Borrar el modelo
        </Button>
      )}
    </div>
  );
}
