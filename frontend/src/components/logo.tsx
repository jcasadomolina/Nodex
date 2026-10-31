import { cn } from "@/lib/utils";

const satellites = [
  [32, 54, 4],
  [14.7, 43, 3.5],
  [12.9, 22, 4.5],
  [32, 12, 3],
  [51.1, 22, 5],
  [49.3, 43, 4],
];

export function Logo({ className, animated = false }: { className?: string; animated?: boolean }) {
  return (
    <svg viewBox="0 0 64 64" className={cn(animated && "logo-animated", className)} aria-hidden="true">
      <rect x={1} y={1} width={62} height={62} rx={16} className="fill-primary" />
      {satellites.map(([x, y, r], i) => (
        <g key={i} className="logo-satellite fill-primary-foreground stroke-primary-foreground" style={{ "--i": i } as React.CSSProperties}>
          <line x1={32} y1={33} x2={x} y2={y} strokeWidth={2.5} strokeLinecap="round" />
          <circle cx={x} cy={y} r={r} />
        </g>
      ))}
      <circle cx={32} cy={33} r={9.5} className="logo-center fill-primary-foreground" />
    </svg>
  );
}
