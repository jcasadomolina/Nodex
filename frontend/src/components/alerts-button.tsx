"use client";

import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { domainOf, formatDateTime } from "@/lib/format";
import { useBrokenLinks, useDismissReminder, useDueReminders, useUpcomingReminders } from "@/lib/queries/alerts";
import type { ReminderItem } from "@/lib/types";
import { cn } from "@/lib/utils";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-1">
      <h3 className="text-xs font-medium text-muted-foreground uppercase">{title}</h3>
      <ul className="grid divide-y">{children}</ul>
    </section>
  );
}

function DueRow({ reminder, onOpen }: { reminder: ReminderItem; onOpen: (id: string) => void }) {
  const dismiss = useDismissReminder();

  return (
    <li className="flex items-center gap-2 py-2">
      <button type="button" onClick={() => onOpen(reminder.nodex.id)} className="min-w-0 flex-1 text-left text-sm hover:underline">
        <span className="block truncate font-medium">{reminder.nodex.title}</span>
        <span className="block text-muted-foreground">{formatDateTime(reminder.remindAt)}</span>
      </button>
      <Button size="sm" variant="outline" disabled={dismiss.isPending} onClick={() => dismiss.mutate(reminder.nodex.id)}>
        {dismiss.isPending && <Spinner />} Descartar
      </Button>
    </li>
  );
}

export function AlertsButton({ className }: { className?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const due = useDueReminders();
  const upcoming = useUpcomingReminders(open);
  const broken = useBrokenLinks(open);
  const seen = useRef<Set<string> | null>(null);
  const count = due.data?.length ?? 0;

  useEffect(() => {
    if (!due.data) return;
    const keys = new Set(due.data.map((r) => `${r.nodex.id}:${r.remindAt}`));
    if (seen.current) {
      for (const reminder of due.data) {
        if (seen.current.has(`${reminder.nodex.id}:${reminder.remindAt}`)) continue;
        toast(`Recordatorio: ${reminder.nodex.title}`, {
          id: `${reminder.nodex.id}:${reminder.remindAt}`,
          action: { label: "Abrir", onClick: () => router.push(`/nodexs/${reminder.nodex.id}`) },
        });
      }
    }
    seen.current = keys;
  }, [due.data, router]);

  function openNodex(id: string) {
    setOpen(false);
    router.push(`/nodexs/${id}`);
  }

  const loading = due.isPending || (open && (upcoming.isPending || broken.isPending));
  const failed = (due.isError && !due.data) || upcoming.isError || broken.isError;
  const empty = count === 0 && upcoming.data?.length === 0 && broken.data?.length === 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={count > 0 ? `Avisos, ${count} ${count === 1 ? "pendiente" : "pendientes"}` : "Avisos"}
        data-tour="avisos"
        className={cn("relative", className)}
      >
        <Bell />
        {count > 0 && (
          <span className="absolute top-1 right-1 grid animate-in zoom-in duration-300 min-w-4 place-content-center rounded-full bg-destructive px-1 text-[10px] leading-4 font-medium text-white">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent side="right" align="end" sideOffset={16} aria-labelledby="alerts-title" className="grid max-h-[70dvh] w-80 gap-3 overflow-y-auto">
        <p id="alerts-title" className="font-medium">
          Avisos
        </p>
        {failed && (
          <div className="grid justify-items-center gap-2 py-4 text-center text-sm">
            <p className="text-muted-foreground">No se han podido cargar los avisos</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                due.refetch();
                upcoming.refetch();
                broken.refetch();
              }}
            >
              Reintentar
            </Button>
          </div>
        )}
        {!failed && loading && <Spinner className="mx-auto my-4 size-6 text-primary" />}
        {!failed && !loading && (
          <>
            {empty && <p className="py-4 text-center text-sm text-muted-foreground">Todo al día</p>}
            {count > 0 && (
              <Section title="Ahora">
                {due.data!.map((reminder) => (
                  <DueRow key={reminder.nodex.id} reminder={reminder} onOpen={openNodex} />
                ))}
              </Section>
            )}
            {upcoming.data && upcoming.data.length > 0 && (
              <Section title="Próximos">
                {upcoming.data.map((reminder) => (
                  <li key={reminder.nodex.id} className="py-2">
                    <button type="button" onClick={() => openNodex(reminder.nodex.id)} className="w-full text-left text-sm hover:underline">
                      <span className="block truncate font-medium">{reminder.nodex.title}</span>
                      <span className="block text-muted-foreground">{formatDateTime(reminder.remindAt)}</span>
                    </button>
                  </li>
                ))}
              </Section>
            )}
            {broken.data && broken.data.length > 0 && (
              <Section title="Enlaces rotos">
                {broken.data.map((link) => (
                  <li key={link.nodex.id} className="flex items-center gap-2 py-2">
                    <button type="button" onClick={() => openNodex(link.nodex.id)} className="min-w-0 flex-1 text-left text-sm hover:underline">
                      <span className="block truncate font-medium">{link.nodex.title}</span>
                      <span className="block truncate text-muted-foreground">{domainOf(link.url)}</span>
                    </button>
                    {link.archiveUrl && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={link.archiveUrl} target="_blank" rel="noreferrer">
                          Ver copia
                        </a>
                      </Button>
                    )}
                  </li>
                ))}
              </Section>
            )}
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
