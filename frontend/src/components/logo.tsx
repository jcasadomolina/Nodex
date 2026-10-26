const satellites = [
  [32, 7, 5],
  [51, 13, 3],
  [57, 32, 5],
  [50, 51, 4],
  [32, 57, 3],
  [13, 50, 3],
  [7, 32, 5],
  [14, 14, 3],
];

export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      {satellites.map(([x, y, r]) => (
        <g key={`${x}-${y}`}>
          <line x1={32} y1={32} x2={x} y2={y} stroke="currentColor" strokeWidth={3} strokeLinecap="round" />
          <circle cx={x} cy={y} r={r} fill="currentColor" />
        </g>
      ))}
      <circle cx={32} cy={32} r={12} fill="currentColor" />
    </svg>
  );
}
