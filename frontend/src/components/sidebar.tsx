"use client";

import { LayoutGrid, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

const itemClass =
  "flex size-11 items-center justify-center rounded-xl text-primary-foreground transition-colors hover:bg-white/30";

function PanelLink({ active }: { active: boolean }) {
  return (
    <Link href="/" aria-label="Panel" aria-current={active ? "page" : undefined} className={cn(itemClass, active && "bg-white/40")}>
      <LayoutGrid />
    </Link>
  );
}

function CurrentPanelLink() {
  const pathname = usePathname();
  return <PanelLink active={pathname === "/" || pathname.startsWith("/nodexs")} />;
}

export function Sidebar({ onOpenSettings }: { onOpenSettings: () => void }) {
  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-2xl bg-primary p-1.5 shadow-lg md:inset-x-auto md:top-1/2 md:bottom-auto md:left-3 md:-translate-y-1/2 md:flex-col md:gap-3 md:px-1.5 md:py-4"
    >
      <Logo className="hidden size-8 text-primary-foreground md:block" />
      <Suspense fallback={<PanelLink active={false} />}>
        <CurrentPanelLink />
      </Suspense>
      <button type="button" aria-label="Ajustes" onClick={onOpenSettings} className={itemClass}>
        <Settings />
      </button>
    </nav>
  );
}
