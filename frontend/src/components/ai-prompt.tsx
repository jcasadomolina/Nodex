"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { enableAi, getPreference, setPreference, useAiStatus } from "@/lib/ai/ai";
import { syncPending } from "@/lib/ai/sync";
import { useInvalidateNodexs } from "@/lib/queries/nodexs";

export function startAi() {
  enableAi().catch(() => toast.error("No se ha podido descargar la IA. Prueba otra vez desde Ajustes"));
}

export function AiPrompt() {
  const status = useAiStatus();
  const invalidate = useInvalidateNodexs();

  useEffect(() => {
    const preference = getPreference();
    if (preference === "on") startAi();
    if (preference === null) {
      toast(
        "Nodex puede descargar su IA a este dispositivo (~120 MB, una sola vez) para ordenar y buscar tus Nodexs. Tus notas no salen del dispositivo para esto.",
        {
          id: "ai-prompt",
          duration: Infinity,
          action: { label: "Descargar", onClick: startAi },
          cancel: { label: "Ahora no", onClick: () => setPreference("off") },
        },
      );
    }
  }, []);

  useEffect(() => {
    if (status.state === "ready") {
      syncPending()
        .then((synced) => {
          if (synced.size > 0) invalidate();
        })
        .catch(() => {});
    }
  }, [status.state, invalidate]);

  return null;
}
