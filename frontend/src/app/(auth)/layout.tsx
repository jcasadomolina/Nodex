import { Bell, ChevronDown, Link2, Sparkles, StickyNote, Waypoints } from "lucide-react";
import { HeroGraph } from "@/components/hero-graph";
import { LandingFeatures } from "@/components/landing-features";
import { LandingFooter } from "@/components/landing-footer";
import { Logo } from "@/components/logo";

const MARKS = [
  { icon: StickyNote, label: "Notas", href: "#guardar" },
  { icon: Link2, label: "Enlaces", href: "#guardar" },
  { icon: Sparkles, label: "IA", href: "#ia" },
  { icon: Waypoints, label: "Grafo", href: "#grafo" },
  { icon: Bell, label: "Recordatorios", href: "#tareas" },
];

const STEP = 32;
const LINKS = [
  [3, 4, 8, 7],
  [33, 5, 38, 9],
  [26, 21, 31, 24],
  [8, 7, 11, 3],
  [5, 20, 9, 25],
  [38, 9, 41, 6],
];

const at = (n: number) => n * STEP + STEP / 2;

function rise(i: number) {
  return { "--i": i } as React.CSSProperties;
}

function NodeField() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_80%)]">
        <svg width={44 * STEP} height={28 * STEP} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <defs>
            <pattern id="node-grid" width={STEP} height={STEP} patternUnits="userSpaceOnUse">
              <circle cx={STEP / 2} cy={STEP / 2} r={1} fill="rgb(255 255 255 / 0.12)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#node-grid)" />
          {LINKS.map(([x1, y1, x2, y2], i) => (
            <g key={i} className="link" style={rise(i)}>
              <line x1={at(x1)} y1={at(y1)} x2={at(x2)} y2={at(y2)} pathLength={1} stroke="var(--primary)" strokeOpacity={0.5} strokeWidth={1} />
              <circle cx={at(x1)} cy={at(y1)} r={2.5} fill="var(--primary)" />
              <circle cx={at(x2)} cy={at(y2)} r={2.5} fill="var(--primary)" />
            </g>
          ))}
        </svg>
      </div>
      <div className="noise absolute inset-0 opacity-[0.06] mix-blend-screen" />
    </div>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="factory flex-1 font-inter">
      <section className="relative isolate flex min-h-dvh items-center overflow-hidden px-4 py-10 md:px-8">
        <NodeField />
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 md:grid-cols-2">
          <div className="grid gap-8">
            <div className="rise flex items-center gap-2" style={rise(0)}>
              <Logo animated className="size-10" />
              <span className="font-sans text-2xl font-extrabold tracking-tight">Nodex</span>
            </div>
            <div className="grid gap-5">
              <nav aria-label="Funcionalidades">
                <ul className="flex flex-wrap gap-2">
                  {MARKS.map(({ icon: Icon, label, href }, i) => (
                    <li key={label}>
                      <a href={href} className="mark flex h-9 items-center gap-2 rounded-full border bg-card px-3 text-sm outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50" style={rise(i)}>
                        <Icon className="size-4" aria-hidden="true" />
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
              <h1 className="rise font-sans text-5xl leading-[1.04] font-extrabold tracking-[-0.035em] text-balance md:text-6xl" style={rise(1)}>
                Tus notas y enlaces, <span className="highlight">conectados</span>
              </h1>
              <p className="rise max-w-md text-lg leading-relaxed text-muted-foreground" style={rise(2)}>
                Guarda lo que encuentras y deja que la IA lo ordene por ti.
              </p>
            </div>
            <div className="rise relative isolate w-full max-w-md overflow-hidden rounded-[10px] border bg-card p-6" style={rise(3)}>
              <div aria-hidden="true" className="absolute inset-x-0 top-0 h-0.5 bg-primary" />
              <div aria-hidden="true" className="noise absolute inset-0 -z-10 opacity-[0.05] mix-blend-screen" />
              {children}
            </div>
          </div>
          <HeroGraph className="rise" style={rise(4)} />
        </div>
        <a
          href="#funcionalidades"
          className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1 font-mono text-xs tracking-[-0.02em] text-muted-foreground uppercase transition-colors hover:text-foreground md:flex"
        >
          Descubre Nodex
          <ChevronDown className="size-4 animate-bounce" aria-hidden="true" />
        </a>
      </section>
      <LandingFeatures />
      <LandingFooter />
    </main>
  );
}
