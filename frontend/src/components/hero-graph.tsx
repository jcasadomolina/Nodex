import { Replay } from "@/components/replay";
import { cn, cue } from "@/lib/utils";

const POINTS = [
  [250, 240],
  [330, 262],
  [212, 205],
  [292, 212],
  [222, 285],
  [282, 298],
  [402, 268],
  [360, 330],
  [408, 322],
  [108, 98],
  [158, 92],
  [118, 150],
  [162, 140],
  [432, 88],
  [478, 122],
  [446, 140],
];

const ORPHANS = [
  [70, 330],
  [512, 372],
  [180, 392],
  [524, 236],
];

const EDGES = [
  [0, 2], [0, 3], [0, 4], [0, 5], [1, 6], [1, 7], [6, 8], [9, 10],
  [9, 11], [10, 12], [13, 14], [13, 15], [5, 7], [12, 2], [15, 6],
];

const GROUPS = [
  { x: 250, y: 250, r: 72, label: "Cocina" },
  { x: 372, y: 292, r: 60, label: "Desarrollo" },
  { x: 132, y: 118, r: 56, label: "Viajes" },
  { x: 452, y: 112, r: 50, label: "Lectura" },
];

const CARDS = [
  { x: 150, y: 46, title: "Vuelos a Lisboa", meta: "VIAJES · URGENTE", d: 9.2 },
  { x: 390, y: 348, title: "Ideas para el portfolio", meta: "DESARROLLO · 3 ENLACES", d: 10.4 },
  { x: 40, y: 352, title: "Tortilla de patatas", meta: "IA → COCINA · 92 %", d: 11.6 },
  { x: 380, y: 150, title: "Dune", meta: "LECTURA · PARA LEER", d: 12.8 },
];

function Card({ x, y, title, meta, d }: (typeof CARDS)[number]) {
  return (
    <g className="g-out" style={cue(d, d + 2.6)}>
      <rect x={x} y={y} width={140} height={36} rx={6} fill="var(--card)" stroke="var(--input)" />
      <text x={x + 9} y={y + 15} fontSize={9.5} fontWeight={600} fill="var(--foreground)">
        {title}
      </text>
      <text x={x + 9} y={y + 27} fontSize={6.5} className="font-mono" fill="var(--muted-foreground)">
        {meta}
      </text>
    </g>
  );
}

export function HeroGraph({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const [a, b] = POINTS;

  return (
    <div aria-hidden="true" className={cn("overflow-hidden rounded-[10px] border bg-[#0d0d0d]", className)} style={style}>
      <div className="flex items-center gap-3 border-b px-4 py-2.5 font-mono text-xs tracking-[-0.02em] text-muted-foreground uppercase">
        <span className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-input" />
          <span className="size-2.5 rounded-full bg-input" />
          <span className="size-2.5 rounded-full bg-input" />
        </span>
        <span className="flex-1 text-center">nodex.app / grafo</span>
        <span className="flex items-center gap-1.5 text-primary">
          <span className="live size-1.5 rounded-full bg-primary" />
          En vivo
        </span>
      </div>
      <Replay every={16500} className="aspect-[560/440]">
        <svg viewBox="0 0 560 440" className="block size-full">
          <g className="g-end" style={cue(15.6)}>
            <g className="g-zoom" style={{ ...cue(4.2), "--ox": "290px", "--oy": "250px", "--z": 2.2 } as React.CSSProperties}>
              {GROUPS.map(({ x, y, r, label }, i) => (
                <g key={label} className="g-pop" style={cue(5.3 + i * 0.2)}>
                  <circle cx={x} cy={y} r={r} fill="rgb(255 162 71 / 0.04)" stroke="var(--input)" strokeDasharray="3 4" />
                  <text x={x} y={y - r - 6} textAnchor="middle" fontSize={7.5} className="font-mono" fill="var(--muted-foreground)">
                    {label.toUpperCase()}
                  </text>
                </g>
              ))}

              <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} pathLength={1} stroke="var(--primary)" strokeWidth={1.5} className="g-draw" style={cue(2.3)} />
              {EDGES.map(([from, to], i) => (
                <line
                  key={i}
                  x1={POINTS[from][0]}
                  y1={POINTS[from][1]}
                  x2={POINTS[to][0]}
                  y2={POINTS[to][1]}
                  pathLength={1}
                  stroke="var(--primary)"
                  strokeOpacity={0.45}
                  className="g-draw"
                  style={cue(6.4 + i * 0.15)}
                />
              ))}

              <circle cx={a[0]} cy={a[1]} r={9} fill="var(--primary)" className="g-pop" style={cue(0.3)} />
              <circle cx={b[0]} cy={b[1]} r={7} fill="var(--primary)" className="g-pop" style={cue(2.9)} />
              {POINTS.slice(2).map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r={5} fill="var(--primary)" className="g-pop" style={cue(5.8 + i * 0.14)} />
              ))}
              {ORPHANS.map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r={5} fill="var(--card)" stroke="var(--muted-foreground)" className="g-pop" style={cue(8 + i * 0.2)} />
              ))}

              <g className="g-out" style={cue(0.7, 4)}>
                <rect x={180} y={164} width={140} height={60} rx={6} fill="var(--card)" stroke="var(--input)" />
                <text x={190} y={182} fontSize={10} fontWeight={600} fill="var(--foreground)" className="g-type" style={cue(0.9)}>
                  Receta de lentejas
                </text>
                <rect x={190} y={190} width={112} height={4} rx={2} fill="var(--input)" className="g-in" style={cue(1.8)} />
                <rect x={190} y={198} width={80} height={4} rx={2} fill="var(--input)" className="g-in" style={cue(1.95)} />
                <g className="g-pop" style={cue(2.1)}>
                  <rect x={190} y={207} width={26} height={10} rx={5} fill="var(--primary)" />
                  <text x={203} y={214} textAnchor="middle" fontSize={6} fontWeight={600} fill="#1f1f1f">
                    Alta
                  </text>
                </g>
              </g>
              <g className="g-out" style={cue(3.1, 4)}>
                <rect x={300} y={276} width={104} height={34} rx={6} fill="var(--card)" stroke="var(--input)" />
                <text x={309} y={290} fontSize={7.5} fontWeight={600} fill="var(--foreground)" className="g-type" style={cue(3.2)}>
                  Documentación de React
                </text>
                <text x={309} y={301} fontSize={6} className="font-mono g-in" fill="var(--muted-foreground)" style={cue(3.5)}>
                  REACT.DEV · 6 MIN
                </text>
              </g>
            </g>

            {CARDS.map((card) => (
              <Card key={card.title} {...card} />
            ))}
          </g>
        </svg>
      </Replay>
    </div>
  );
}
