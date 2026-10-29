"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { TASK_STATUS_LABELS, toDateInput } from "@/lib/format";
import { useTaskCalendar } from "@/lib/queries/tasks";
import type { TaskCard } from "@/lib/types";
import { newTabClick, preventMiddleScroll } from "@/lib/use-open-nodex";
import { cn } from "@/lib/utils";

const chipClass = {
  todo: "bg-muted text-foreground",
  doing: "bg-primary text-primary-foreground",
  done: "bg-muted text-muted-foreground line-through",
};

function firstOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function dayKey(date: Date) {
  return date.toLocaleDateString("sv-SE");
}

function TaskChip({ card, onOpen }: { card: TaskCard; onOpen: (id: string, newTab?: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={(event) => onOpen(card.nodex.id, newTabClick(event))}
      onMouseDown={preventMiddleScroll}
      onAuxClick={(event) => event.button === 1 && onOpen(card.nodex.id, true)}
      title={`${card.nodex.title} · ${TASK_STATUS_LABELS[card.status]}`}
      className={cn("w-full truncate rounded-md px-1.5 py-0.5 text-left text-xs hover:opacity-80", chipClass[card.status])}
    >
      {card.nodex.title}
    </button>
  );
}

export function TaskCalendar({ onOpen }: { onOpen: (id: string, newTab?: boolean) => void }) {
  const [month, setMonth] = useState(() => firstOfMonth(new Date()));
  const start = addDays(month, -((month.getDay() + 6) % 7));
  const days = Array.from({ length: 42 }, (_, i) => addDays(start, i));
  const tasks = useTaskCalendar(start, addDays(start, 42));
  const today = dayKey(new Date());

  const byDay = new Map<string, TaskCard[]>();
  for (const card of tasks.data ?? []) {
    const key = toDateInput(card.dueAt!);
    byDay.set(key, [...(byDay.get(key) ?? []), card]);
  }
  const daysWithTasks = days.filter((day) => day.getMonth() === month.getMonth() && byDay.has(dayKey(day)));

  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-2">
        <h2 className="mr-auto text-lg font-medium first-letter:uppercase">
          {month.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
        </h2>
        <Button variant="outline" size="sm" onClick={() => setMonth(firstOfMonth(new Date()))}>
          Hoy
        </Button>
        <Button variant="outline" size="icon-sm" aria-label="Mes anterior" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>
          <ChevronLeft />
        </Button>
        <Button variant="outline" size="icon-sm" aria-label="Mes siguiente" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>
          <ChevronRight />
        </Button>
      </div>

      {tasks.isPending && <Spinner className="mx-auto my-12 size-8 text-primary" />}
      {tasks.isError && (
        <div className="grid justify-items-center gap-3 py-12 text-center">
          <p className="text-muted-foreground">No se ha podido cargar el calendario</p>
          <Button variant="outline" onClick={() => tasks.refetch()}>
            Reintentar
          </Button>
        </div>
      )}

      {tasks.data && (
        <>
          <div className="hidden overflow-hidden rounded-2xl border bg-border md:grid md:grid-cols-7 md:gap-px">
            {days.slice(0, 7).map((day) => (
              <div key={`head-${dayKey(day)}`} className="bg-muted/50 py-1.5 text-center text-xs font-medium text-muted-foreground capitalize">
                {day.toLocaleDateString("es-ES", { weekday: "short" })}
              </div>
            ))}
            {days.map((day) => {
              const key = dayKey(day);
              return (
                <div key={key} className={cn("grid min-h-24 content-start gap-1 bg-card p-1.5", day.getMonth() !== month.getMonth() && "bg-muted/30 text-muted-foreground")}>
                  <span
                    className={cn("grid size-6 place-content-center rounded-full text-xs", key === today && "bg-primary font-medium text-primary-foreground")}
                    aria-current={key === today ? "date" : undefined}
                  >
                    {day.getDate()}
                  </span>
                  {byDay.get(key)?.map((card) => <TaskChip key={card.nodex.id} card={card} onOpen={onOpen} />)}
                </div>
              );
            })}
          </div>

          <div className="grid gap-4 md:hidden">
            {daysWithTasks.length === 0 && <p className="py-8 text-center text-muted-foreground">No hay tareas con fecha este mes</p>}
            {daysWithTasks.map((day) => (
              <section key={dayKey(day)} className="grid gap-1.5">
                <h3 className={cn("text-sm font-medium first-letter:uppercase", dayKey(day) === today && "text-primary")}>
                  {day.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
                </h3>
                {byDay.get(dayKey(day))!.map((card) => (
                  <TaskChip key={card.nodex.id} card={card} onOpen={onOpen} />
                ))}
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
