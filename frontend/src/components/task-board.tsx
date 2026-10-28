"use client";

import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragOverEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { TaskCardView } from "@/components/task-card";
import { TASK_STATUS_LABELS } from "@/lib/format";
import { useMoveTask } from "@/lib/queries/tasks";
import type { TaskCard, TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

type Columns = Record<TaskStatus, TaskCard[]>;

const STATUSES = Object.keys(TASK_STATUS_LABELS) as TaskStatus[];

function SortableTask({ card, onOpen }: { card: TaskCard; onOpen: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.nodex.id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      aria-roledescription="tarea arrastrable"
      aria-label={card.nodex.title}
      onClick={() => onOpen(card.nodex.id)}
      onKeyDown={(event) => {
        listeners?.onKeyDown?.(event);
        if (event.key === "Enter" && !isDragging) onOpen(card.nodex.id);
      }}
      className={cn("cursor-grab rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50", isDragging && "opacity-40")}
    >
      <TaskCardView card={card} />
    </li>
  );
}

function Column({ status, cards, onOpen }: { status: TaskStatus; cards: TaskCard[]; onOpen: (id: string) => void }) {
  const { setNodeRef } = useDroppable({ id: status });

  return (
    <section
      aria-labelledby={`column-${status}`}
      className="flex w-[85vw] shrink-0 snap-start flex-col gap-3 rounded-2xl bg-muted/50 p-3 md:w-auto md:flex-1"
    >
      <h2 id={`column-${status}`} className="flex items-center justify-between px-1 font-medium">
        {TASK_STATUS_LABELS[status]}
        <span className="text-sm text-muted-foreground">{cards.length}</span>
      </h2>
      <SortableContext id={status} items={cards.map((card) => card.nodex.id)} strategy={verticalListSortingStrategy}>
        <ul ref={setNodeRef} className="grid min-h-24 flex-1 content-start gap-2">
          {cards.map((card) => (
            <SortableTask key={card.nodex.id} card={card} onOpen={onOpen} />
          ))}
        </ul>
      </SortableContext>
    </section>
  );
}

export function TaskBoard({ columns, onOpen }: { columns: Columns; onOpen: (id: string) => void }) {
  const move = useMoveTask();
  const [items, setItems] = useState(columns);
  const [source, setSource] = useState(columns);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes: { start: ["Space"], cancel: ["Escape"], end: ["Space"] },
    }),
  );

  if (columns !== source && activeId === null) {
    setSource(columns);
    setItems(columns);
  }

  const statusOf = (id: UniqueIdentifier) =>
    STATUSES.includes(id as TaskStatus) ? (id as TaskStatus) : STATUSES.find((s) => items[s].some((c) => c.nodex.id === id));
  const cardOf = (id: UniqueIdentifier) => STATUSES.flatMap((s) => items[s]).find((c) => c.nodex.id === id);
  const titleOf = (id: UniqueIdentifier) => `«${cardOf(id)?.nodex.title ?? ""}»`;
  const placeOf = (id: UniqueIdentifier) => {
    const status = statusOf(id);
    if (!status) return "fuera de las columnas";
    const index = items[status].findIndex((c) => c.nodex.id === id);
    return index === -1 ? TASK_STATUS_LABELS[status] : `${TASK_STATUS_LABELS[status]}, posición ${index + 1}`;
  };

  const announcements: Announcements = {
    onDragStart: ({ active }) => `Has cogido la tarea ${titleOf(active.id)}, en ${placeOf(active.id)}.`,
    onDragOver: ({ active, over }) =>
      over ? `Tarea ${titleOf(active.id)} sobre ${placeOf(over.id)}.` : `Tarea ${titleOf(active.id)} fuera de las columnas.`,
    onDragEnd: ({ active }) => `Tarea ${titleOf(active.id)} soltada en ${placeOf(active.id)}.`,
    onDragCancel: ({ active }) => `Movimiento cancelado. La tarea ${titleOf(active.id)} vuelve a su sitio.`,
  };

  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over) return;
    const from = statusOf(active.id);
    const to = statusOf(over.id);
    if (!from || !to || from === to) return;

    setItems((current) => {
      const card = current[from].find((c) => c.nodex.id === active.id);
      if (!card) return current;
      const overIndex = current[to].findIndex((c) => c.nodex.id === over.id);
      const index = overIndex === -1 ? current[to].length : overIndex;
      return {
        ...current,
        [from]: current[from].filter((c) => c.nodex.id !== active.id),
        [to]: [...current[to].slice(0, index), card, ...current[to].slice(index)],
      };
    });
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    const status = statusOf(active.id);
    if (!over || !status) {
      setItems(columns);
      return;
    }

    const column = items[status];
    const oldIndex = column.findIndex((c) => c.nodex.id === active.id);
    const overIndex = column.findIndex((c) => c.nodex.id === over.id);
    const index = overIndex === -1 ? oldIndex : overIndex;
    setItems({ ...items, [status]: arrayMove(column, oldIndex, index) });

    if (columns[status].findIndex((c) => c.nodex.id === active.id) === index) return;
    move.mutate({ nodexId: String(active.id), status, index }, { onError: () => setItems(columns) });
  }

  const active = activeId === null ? null : cardOf(activeId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      accessibility={{
        announcements,
        screenReaderInstructions: {
          draggable: "Pulsa espacio para coger la tarea, usa las flechas para moverla y espacio para soltarla. Esc cancela. Intro abre el Nodex.",
        },
      }}
      onDragStart={({ active }) => setActiveId(active.id)}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        setActiveId(null);
        setItems(columns);
      }}
    >
      <div className="-mx-3 flex snap-x snap-mandatory scroll-px-3 gap-3 overflow-x-auto px-3 pb-2 md:mx-0 md:px-0">
        {STATUSES.map((status) => (
          <Column key={status} status={status} cards={items[status]} onOpen={onOpen} />
        ))}
      </div>
      <DragOverlay>{active && <TaskCardView card={active} />}</DragOverlay>
    </DndContext>
  );
}
