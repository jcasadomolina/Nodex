"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { api } from "@/lib/api";
import { endTour, TUTORIAL_VERSION, tourPending } from "@/lib/tour";
import type { User } from "@/lib/types";

const STEPS = [
  { target: "buscar", title: "Busca lo que quieras", text: "Escribe una palabra o una idea: Nodex encuentra lo que guardaste aunque no uses las mismas palabras." },
  { target: "grupos", title: "Tus grupos", text: "Filtra el panel por grupo. En «Huérfanos» están los Nodexs que aún no tienen grupo." },
  { target: "nuevo-grupo", title: "Crea un grupo", text: "Agrupa tus Nodexs por temas: cocina, viajes, trabajo… Un Nodex puede estar en varios." },
  { target: "ordenar", title: "Ordena y filtra", text: "Pon primero lo más urgente o muestra solo una prioridad." },
  { target: "crear", title: "Crea tu primer Nodex", text: "Escribe una nota o pega un enlace. Te avisaremos si ya tenías algo parecido." },
  { target: "panel", title: "Tu panel", text: "Aquí vuelves siempre para ver todos tus Nodexs." },
  { target: "grafo", title: "Vista gráfica", text: "Mira tus Nodexs como un mapa: cada grupo en el centro, rodeado de sus Nodexs." },
  { target: "ajustes", title: "Ajustes", text: "Cambia el tema, revisa tu perfil o vuelve a ver esta bienvenida cuando quieras." },
];

function findVisible(target: string) {
  const el = document.querySelector<HTMLElement>(`[data-tour="${target}"]`);
  return el && el.isConnected && el.getClientRects().length > 0 ? el : null;
}

export function Tour() {
  const queryClient = useQueryClient();
  const [steps, setSteps] = useState<typeof STEPS>([]);
  const [index, setIndex] = useState(0);
  const [, setTick] = useState(0);
  const step = steps[index];
  const target = step ? findVisible(step.target) : null;

  useEffect(() => {
    if (!tourPending()) return;
    const timer = setTimeout(() => setSteps(STEPS.filter((s) => findVisible(s.target))));
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (steps.length === 0) return;
    const observer = new MutationObserver(() => setTick((tick) => tick + 1));
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [steps.length]);

  useEffect(() => {
    target?.scrollIntoView({ block: "nearest", inline: "nearest" });
    target?.classList.add("tour-target");
    return () => target?.classList.remove("tour-target");
  }, [target]);

  function finish() {
    setSteps([]);
    endTour();
    api<{ tutorialCompletedVersion: number }>("/me/tutorial", { method: "PUT", body: { version: TUTORIAL_VERSION } })
      .then(({ tutorialCompletedVersion }) =>
        queryClient.setQueryData<User>(["me"], (me) => me && { ...me, tutorialCompletedVersion }),
      )
      .catch(() => toast.error("No se ha podido guardar que has visto el tutorial. Volverá a salir la próxima vez"));
  }

  if (!step || !target) return null;
  const last = index === steps.length - 1;

  return (
    <Popover open>
      <PopoverAnchor virtualRef={{ current: target }} />
      <PopoverContent
        className="w-72"
        collisionPadding={12}
        onEscapeKeyDown={finish}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <p className="text-xs text-muted-foreground">
          Paso {index + 1} de {steps.length}
        </p>
        <h2 className="mt-1 font-bold">{step.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{step.text}</p>
        <div className="mt-4 flex items-center gap-2">
          <Button variant="ghost" size="sm" className="mr-auto" onClick={finish}>
            Saltar tutorial
          </Button>
          {index > 0 && (
            <Button variant="outline" size="sm" onClick={() => setIndex(index - 1)}>
              Anterior
            </Button>
          )}
          <Button size="sm" onClick={() => (last ? finish() : setIndex(index + 1))}>
            {last ? "Terminar" : "Siguiente"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
