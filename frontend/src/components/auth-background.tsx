const groups = [
  {
    className: "drift-a",
    nodes: [
      [12, 18, 1.6],
      [24, 30, 1],
      [8, 44, 1.2],
      [30, 12, 0.8],
      [20, 58, 1.4],
    ],
  },
  {
    className: "drift-b",
    nodes: [
      [70, 70, 1.8],
      [84, 58, 1.1],
      [62, 86, 1],
      [90, 82, 1.3],
      [76, 92, 0.8],
    ],
  },
];

export function AuthBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-24 -right-32 aspect-square w-[70vw] max-w-[44rem] rotate-12 rounded-[38%] bg-primary/90 md:top-1/2 md:-right-24 md:w-[48vw] md:-translate-y-1/2" />
      <div className="absolute -bottom-48 -left-40 size-[30rem] -rotate-12 rounded-[40%] bg-primary/25" />
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full text-foreground/10">
        {groups.map(({ className, nodes }) => (
          <g key={className} className={className}>
            {nodes.slice(1).map(([x, y], i) => (
              <line key={i} x1={nodes[0][0]} y1={nodes[0][1]} x2={x} y2={y} stroke="currentColor" strokeWidth={0.1} />
            ))}
            {nodes.map(([x, y, r], i) => (
              <circle key={i} cx={x} cy={y} r={r * 0.6} fill="currentColor" className="pulse" style={{ animationDelay: `${i * 0.8}s` }} />
            ))}
          </g>
        ))}
      </svg>
    </div>
  );
}
