import { Bell, Check, Clock, CornerDownLeft, Link2, Search, Sparkles, Square } from "lucide-react";
import { Replay } from "@/components/replay";
import { cn, cue } from "@/lib/utils";

const card = "rounded-xl border bg-card p-3 text-sm";
const label = "font-mono text-xs tracking-[-0.02em] text-muted-foreground uppercase";

function SaveDemo() {
  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-2 rounded-full border bg-card px-3 py-2 text-sm">
        <Link2 className="size-4 text-muted-foreground" />
        <span className="g-type flex-1 truncate" style={cue(0.3)}>
          https://react.dev/learn
        </span>
        <CornerDownLeft className="g-pop size-4 text-primary" style={cue(1.3)} />
      </div>
      <div className="g-in overflow-hidden rounded-xl border bg-card text-sm" style={cue(1.7)}>
        <div className="grid h-20 place-content-center bg-input/60 font-sans text-xl font-extrabold tracking-tight">Quick Start</div>
        <div className="grid gap-1.5 p-3">
          <p className="font-semibold">Documentación de React</p>
          <p className="g-in flex items-center gap-1 text-xs text-muted-foreground" style={cue(2.1)}>
            <Link2 className="size-3.5" /> react.dev · <Clock className="size-3.5" /> 6 min de lectura
          </p>
          <span className="g-pop w-fit rounded-full bg-secondary px-2 py-0.5 text-xs" style={cue(2.5)}>
            Para leer
          </span>
        </div>
      </div>
      <div className={cn(card, "g-in grid gap-1.5")} style={cue(3.4)}>
        <p className="font-semibold">Lista de la compra</p>
        {["Lentejas", "Chorizo", "Pimentón"].map((item, i) => (
          <p key={item} className="g-in flex items-center gap-2 text-muted-foreground" style={cue(3.8 + i * 0.3)}>
            <span className="relative grid size-4 place-content-center">
              <Square className="size-4" />
              {i === 0 && <Check className="g-pop absolute inset-0 size-4 text-primary" style={cue(5.2)} />}
            </span>
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}

function SortDemo() {
  const slot = "h-14";
  return (
    <div className="grid gap-4">
      <div className="g-in flex items-center gap-2 rounded-full border bg-card px-3 py-2 text-sm" style={cue(4.6)}>
        <Search className="size-4 text-muted-foreground" />
        <span className="g-type" style={cue(5)}>
          comida de cuchara
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid content-start gap-3">
          <p className={label}>
            Cocina <span className="g-pop inline-block text-primary" style={cue(3.4)}>+1</span>
          </p>
          {["Receta de lentejas", "Guiso de garbanzos"].map((title) => (
            <div key={title} className={cn(card, slot, "relative font-semibold")}>
              {title}
              <span className="g-pop absolute inset-0 rounded-xl ring-1 ring-primary" style={cue(6.2)} />
            </div>
          ))}
        </div>
        <div className="grid content-start gap-3">
          <p className={label}>Huérfanos</p>
          <div
            className={cn(card, slot, "g-move grid content-between")}
            style={{ ...cue(2.6), "--dx": "calc(-100% - 1rem)", "--dy": "calc(7rem + 1.5rem)" } as React.CSSProperties}
          >
            <span className="font-semibold">Tortilla de patatas</span>
            <span className="text-xs text-muted-foreground">Sin grupo</span>
          </div>
        </div>
      </div>
      <p className="g-out flex items-center gap-2 font-mono text-xs text-primary uppercase" style={cue(1.2, 3.6)}>
        <Sparkles className="size-4" /> IA · encaja en Cocina (92 %)
      </p>
    </div>
  );
}

const GRAPH = [
  [200, 150, 9],
  [120, 90, 6],
  [280, 80, 6],
  [300, 200, 6],
  [110, 210, 6],
  [60, 140, 4],
  [350, 130, 4],
  [190, 250, 4],
  [240, 40, 4],
];

const GRAPH_EDGES = [
  [0, 1], [0, 2], [0, 3], [0, 4], [1, 5], [2, 6], [3, 6], [4, 7], [2, 8], [1, 4],
];

function GraphDemo() {
  return (
    <svg viewBox="0 0 400 290" className="block w-full">
      <g className="drift-a">
        {GRAPH_EDGES.map(([from, to], i) => (
          <line
            key={i}
            x1={GRAPH[from][0]}
            y1={GRAPH[from][1]}
            x2={GRAPH[to][0]}
            y2={GRAPH[to][1]}
            pathLength={1}
            stroke="var(--primary)"
            strokeOpacity={0.5}
            className="g-draw"
            style={cue(0.8 + i * 0.18)}
          />
        ))}
        {GRAPH.map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} fill={i === 0 ? "var(--primary)" : "var(--foreground)"} className="g-pop" style={cue(0.2 + i * 0.12)} />
        ))}
        <circle cx={200} cy={150} r={18} fill="none" stroke="var(--primary)" className="g-pop" style={cue(3.4)} />
        <g className="g-out" style={cue(3.7, 8)}>
          <rect x={222} y={160} width={150} height={38} rx={6} fill="var(--card)" stroke="var(--input)" />
          <text x={232} y={176} fontSize={11} fontWeight={600} fill="var(--foreground)">
            Receta de lentejas
          </text>
          <text x={232} y={189} fontSize={8} className="font-mono" fill="var(--muted-foreground)">
            COCINA · 4 CONEXIONES
          </text>
        </g>
      </g>
    </svg>
  );
}

function TasksDemo() {
  const slot = cn(card, "h-16 font-semibold");
  const step = { "--dx": "calc(100% + 0.75rem)", "--dy": "0px" };
  return (
    <div className="relative min-h-72">
      <div className="grid grid-cols-3 gap-3">
        <div className="grid content-start gap-2">
          <p className={label}>Por hacer</p>
          <div className={slot}>Comprar garbanzos</div>
          <div className="g-move" style={{ ...cue(1.4), ...step } as React.CSSProperties}>
            <div className="g-move" style={{ ...cue(3), ...step } as React.CSSProperties}>
              <div className={cn(slot, "relative grid content-between")}>
                Vuelos a Lisboa
                <span className="text-xs font-normal text-muted-foreground">Hoy, 18:00</span>
                <Check className="g-pop absolute top-3 right-3 size-4 text-primary" style={cue(3.8)} />
              </div>
            </div>
          </div>
        </div>
        <div className="grid content-start gap-2">
          <p className={label}>En curso</p>
          <div className={slot}>README del portfolio</div>
        </div>
        <div className="grid content-start gap-2">
          <p className={label}>Hecha</p>
          <div className={cn(slot, "text-muted-foreground line-through")}>Receta de lentejas</div>
        </div>
      </div>
      <div className={cn(card, "g-out absolute right-0 bottom-0 flex items-center gap-2 shadow-lg")} style={cue(4.8, 8.4)}>
        <Bell className="size-4 text-primary" />
        <span>
          <span className="block font-semibold">Recordatorio</span>
          <span className="text-xs text-muted-foreground">Vuelos a Lisboa · hoy 18:00</span>
        </span>
      </div>
    </div>
  );
}

const FEATURES = [
  {
    id: "guardar",
    eyebrow: "01 · Guardar",
    title: "Guarda cualquier cosa en un segundo",
    text: "Pega un enlace y Nodex trae el título, la imagen y los minutos de lectura. Escribe notas en Markdown con listas de tareas y marca lo que quieras leer más tarde.",
    demo: <SaveDemo />,
    every: 8000,
  },
  {
    id: "ia",
    eyebrow: "02 · Ordenar",
    title: "La IA lo ordena por ti",
    text: "Los Nodexs sin grupo encuentran sitio solos: la IA los lleva al grupo que encaja o te propone uno nuevo. Y buscas por lo que significa, no por las palabras exactas.",
    demo: <SortDemo />,
    every: 9000,
  },
  {
    id: "grafo",
    eyebrow: "03 · Conectar",
    title: "Mira cómo se conecta todo",
    text: "La vista gráfica dibuja tus Nodexs y grupos como una red. Acércate, explora y descubre relaciones entre cosas que guardaste en momentos distintos.",
    demo: <GraphDemo />,
    every: 9000,
  },
  {
    id: "tareas",
    eyebrow: "04 · Hacer",
    title: "De la idea a la tarea",
    text: "Convierte cualquier Nodex en una tarea, muévela por el tablero o el calendario y recibe un aviso cuando llegue la fecha.",
    demo: <TasksDemo />,
    every: 9000,
  },
];

export function LandingFeatures() {
  return (
    <div id="funcionalidades" className="mx-auto grid max-w-6xl gap-24 px-4 py-24 md:gap-32 md:px-8">
      {FEATURES.map(({ id, eyebrow, title, text, demo, every }, i) => (
        <section key={id} id={id} aria-labelledby={`${id}-title`} className="grid scroll-mt-12 items-center gap-10 md:grid-cols-2 md:gap-16">
          <div className={cn("reveal grid gap-4", i % 2 === 1 && "md:order-last")}>
            <p className="flex items-center gap-2 font-mono text-xs tracking-[-0.02em] text-primary uppercase">
              <span className="size-1.5 rounded-full bg-primary" />
              {eyebrow}
            </p>
            <h2 id={`${id}-title`} className="font-sans text-3xl leading-tight font-extrabold tracking-[-0.03em] text-balance md:text-4xl">
              {title}
            </h2>
            <p className="max-w-md text-lg leading-relaxed text-muted-foreground">{text}</p>
          </div>
          <div aria-hidden="true" className="reveal rounded-[10px] border bg-[#0d0d0d] p-5 md:p-6">
            <Replay every={every} className="min-h-72">
              {demo}
            </Replay>
          </div>
        </section>
      ))}
    </div>
  );
}
