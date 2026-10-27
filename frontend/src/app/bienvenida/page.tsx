"use client";

import { Bell, Link2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { AuthBackground } from "@/components/auth-background";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { startTour } from "@/lib/tour";
import { cn } from "@/lib/utils";

const SLIDES = [
  {
    icon: <Logo animated className="size-24" />,
    title: "Te damos la bienvenida a Nodex",
    text: "Tu sitio para guardar notas y enlaces. Cada cosa que guardas es un Nodex, y Nodex los conecta entre sí.",
  },
  {
    icon: <Link2 className="size-16 text-primary" />,
    title: "Guarda lo que encuentres",
    text: "Escribe una nota o pega un enlace. De los enlaces sacamos el título, la descripción y la imagen, y te avisamos si dejan de funcionar.",
  },
  {
    icon: <Sparkles className="size-16 text-primary" />,
    title: "La IA te ayuda a ordenarlo",
    text: "Te sugiere en qué grupo va cada Nodex, encuentra cosas por su significado, te enseña los relacionados y te avisa si guardas algo repetido. Tú siempre decides.",
  },
  {
    icon: <Bell className="size-16 text-primary" />,
    title: "Tareas, recordatorios y permisos",
    text: "Convierte un Nodex en tarea o ponle un recordatorio. Solo te pediremos un permiso, el de enviarte notificaciones, y únicamente cuando crees tu primer recordatorio.",
  },
];

export default function WelcomePage() {
  const router = useRouter();
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const last = index === SLIDES.length - 1;

  function goTo(i: number) {
    const target = Math.max(0, Math.min(SLIDES.length - 1, i));
    setIndex(target);
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.current?.scrollTo({ left: target * track.current.clientWidth, behavior: reduced ? "auto" : "smooth" });
  }

  function enter() {
    startTour();
    router.push("/");
  }

  return (
    <main
      className="relative isolate flex flex-1 flex-col items-center justify-center overflow-hidden px-4 py-8"
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") goTo(index + 1);
        if (event.key === "ArrowLeft") goTo(index - 1);
      }}
    >
      <AuthBackground />
      <section
        aria-roledescription="carrusel"
        aria-label="Qué es Nodex"
        className="w-full max-w-lg overflow-hidden rounded-3xl border bg-card/95 shadow-xl"
      >
        <div
          ref={track}
          tabIndex={0}
          onScroll={(event) => {
            const el = event.currentTarget;
            setIndex(Math.round(el.scrollLeft / el.clientWidth));
          }}
          className="flex snap-x snap-mandatory overflow-x-auto outline-none [scrollbar-width:none]"
        >
          {SLIDES.map((slide, i) => (
            <article
              key={slide.title}
              aria-roledescription="diapositiva"
              aria-label={`${i + 1} de ${SLIDES.length}`}
              className="grid w-full shrink-0 snap-center justify-items-center gap-4 p-8 text-center"
            >
              <div className="flex h-28 items-center">{slide.icon}</div>
              <h1 className="text-2xl font-extrabold">{slide.title}</h1>
              <p className="text-muted-foreground">{slide.text}</p>
            </article>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 border-t px-6 py-4">
          <Button variant="outline" size="lg" onClick={() => goTo(index - 1)} disabled={index === 0}>
            Anterior
          </Button>
          <div className="flex gap-2" aria-hidden="true">
            {SLIDES.map((slide, i) => (
              <span key={slide.title} className={cn("h-2 rounded-full bg-foreground/20 transition-all", i === index ? "w-6 bg-primary" : "w-2")} />
            ))}
          </div>
          {last ? (
            <Button size="lg" onClick={enter}>
              Entrar a Nodex
            </Button>
          ) : (
            <Button size="lg" onClick={() => goTo(index + 1)}>
              Siguiente
            </Button>
          )}
        </div>
      </section>
    </main>
  );
}
