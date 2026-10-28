"use client";

import { LayoutGrid, Settings, SquareCheckBig, Waypoints } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

const itemClass =
  "flex size-11 items-center justify-center rounded-xl text-primary-foreground transition-colors hover:bg-white/30";

const NAV = [
  { href: "/", label: "Panel", tour: "panel", icon: LayoutGrid, match: (p: string) => p === "/" || p.startsWith("/nodexs") },
  { href: "/grafo", label: "Vista gráfica", tour: "grafo", icon: Waypoints, match: (p: string) => p.startsWith("/grafo") },
  { href: "/tareas", label: "Tareas", tour: "tareas", icon: SquareCheckBig, match: (p: string) => p.startsWith("/tareas") },
];

function NavLinks({ pathname }: { pathname: string | null }) {
  return NAV.map(({ href, label, tour, icon: Icon, match }) => {
    const active = pathname !== null && match(pathname);
    return (
      <Link key={href} href={href} aria-label={label} data-tour={tour} aria-current={active ? "page" : undefined} className={cn(itemClass, active && "bg-white/40")}>
        <Icon />
      </Link>
    );
  });
}

function CurrentNavLinks() {
  return <NavLinks pathname={usePathname()} />;
}

export function Sidebar({ onOpenSettings }: { onOpenSettings: () => void }) {
  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-2xl bg-primary p-1.5 shadow-lg md:inset-x-auto md:top-1/2 md:bottom-auto md:left-3 md:-translate-y-1/2 md:flex-col md:gap-3 md:px-1.5 md:py-4"
    >
      <Logo className="hidden size-10 md:block" />
      <Suspense fallback={<NavLinks pathname={null} />}>
        <CurrentNavLinks />
      </Suspense>
      <button type="button" aria-label="Ajustes" data-tour="ajustes" onClick={onOpenSettings} className={itemClass}>
        <Settings />
      </button>
    </nav>
  );
}
