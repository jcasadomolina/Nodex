"use client";

import { Fragment, useEffect, useRef, useState } from "react";

export function Replay({ every, className, children }: { every: number; className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [run, setRun] = useState(0);

  useEffect(() => {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let timer: ReturnType<typeof setInterval> | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        clearInterval(timer);
        if (!entry.isIntersecting) return;
        setRun((n) => (still && n > 0 ? n : n + 1));
        if (!still) timer = setInterval(() => setRun((n) => n + 1), every);
      },
      { threshold: 0.3 },
    );
    observer.observe(ref.current!);
    return () => {
      observer.disconnect();
      clearInterval(timer);
    };
  }, [every]);

  return (
    <div ref={ref} className={className}>
      {run > 0 && <Fragment key={run}>{children}</Fragment>}
    </div>
  );
}
