import { Bell, Link2, Sparkles, StickyNote, Waypoints } from "lucide-react";
import { AppPreview } from "@/components/app-preview";
import { Logo } from "@/components/logo";

const MARKS = [
  { icon: StickyNote, color: "#ffa247" },
  { icon: Link2, color: "#097fe8" },
  { icon: Sparkles, color: "#ffb110" },
  { icon: Waypoints, color: "#f64932" },
  { icon: Bell, color: "#62aef0" },
];

function rise(i: number) {
  return { "--i": i } as React.CSSProperties;
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 items-center px-4 py-10 font-inter md:px-8">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 md:grid-cols-2">
        <section className="grid gap-8">
          <div className="rise flex items-center gap-2" style={rise(0)}>
            <Logo animated className="size-10" />
            <span className="font-sans text-2xl font-extrabold tracking-tight">Nodex</span>
          </div>
          <div className="grid gap-5">
            <ul aria-hidden="true" className="flex gap-2">
              {MARKS.map(({ icon: Icon, color }, i) => (
                <li
                  key={i}
                  className="mark grid size-11 place-content-center rounded-full border-2 bg-card"
                  style={{ borderColor: color, color, "--i": i } as React.CSSProperties}
                >
                  <Icon className="size-5" />
                </li>
              ))}
            </ul>
            <h1 className="rise font-sans text-5xl leading-[1.04] font-extrabold tracking-[-0.035em] text-balance md:text-6xl" style={rise(1)}>
              Tus notas y enlaces, <span className="highlight">conectados</span>
            </h1>
            <p className="rise max-w-md text-lg leading-relaxed text-muted-foreground" style={rise(2)}>
              Guarda lo que encuentras y deja que la IA lo ordene por ti.
            </p>
          </div>
          <div className="rise w-full max-w-md rounded-[12px] border bg-card p-6 text-card-foreground" style={rise(3)}>
            {children}
          </div>
        </section>
        <div className="rise hidden rounded-[12px] bg-primary p-8 md:block" style={rise(4)}>
          <AppPreview />
        </div>
      </div>
    </main>
  );
}
