"use client";

import { Plus, SquareCheckBig } from "lucide-react";
import { useState } from "react";
import { NodexDialog } from "@/components/nodex-dialog";
import { Spinner } from "@/components/spinner";
import { TaskBoard } from "@/components/task-board";
import { TaskCalendar } from "@/components/task-calendar";
import { TopBar } from "@/components/top-bar";
import { Button } from "@/components/ui/button";
import { useTaskBoard } from "@/lib/queries/tasks";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "board", label: "Tablero" },
  { id: "calendar", label: "Calendario" },
] as const;

export default function TasksPage() {
  const board = useTaskBoard();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("board");
  const [dialog, setDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const empty = board.data && Object.values(board.data).every((cards) => cards.length === 0);

  const openNodex = (id: string) => setDialog({ open: true, id });
  const createTask = () => setDialog({ open: true, id: null });

  return (
    <div className="mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-4">
      <TopBar icon={SquareCheckBig} location="Tareas" />

      <div role="tablist" aria-label="Vista de tareas" className="flex gap-2">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            id={`tab-${id}`}
            type="button"
            role="tab"
            aria-selected={tab === id}
            aria-controls={`panel-${id}`}
            onClick={() => setTab(id)}
            className={cn(
              "h-8 rounded-full border px-3 text-sm transition-colors",
              tab === id ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {board.isPending && <Spinner className="mx-auto my-12 size-8 text-primary" />}
        {board.isError && (
          <div className="grid justify-items-center gap-3 py-12 text-center">
            <p className="text-muted-foreground">No se han podido cargar las tareas</p>
            <Button variant="outline" onClick={() => board.refetch()}>
              Reintentar
            </Button>
          </div>
        )}
        {empty && (
          <div className="grid justify-items-center gap-3 py-12 text-center">
            <p className="text-muted-foreground">Aún no tienes tareas</p>
            <Button onClick={createTask}>
              <Plus /> Crear tarea
            </Button>
          </div>
        )}
        {board.data && !empty && (tab === "board" ? <TaskBoard columns={board.data} onOpen={openNodex} /> : <TaskCalendar onOpen={openNodex} />)}
      </div>

      <Button
        size="icon-lg"
        aria-label="Crear tarea"
        onClick={createTask}
        className="fixed right-6 bottom-24 z-30 size-14 rounded-full shadow-lg md:bottom-6 [&_svg:not([class*='size-'])]:size-6"
      >
        <Plus />
      </Button>
      <NodexDialog
        id={dialog.id}
        defaultTask
        open={dialog.open}
        onOpenChange={(open) => setDialog((current) => ({ ...current, open }))}
        onOpenNodex={openNodex}
      />
    </div>
  );
}
