"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fromDateInput, fromDateTimeInput, PRIORITY_LABELS, TASK_STATUS_LABELS, toDateInput, toDateTimeInput } from "@/lib/format";
import { useGroups } from "@/lib/queries/groups";
import type { Priority, TaskInput, TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const PRIORITIES: (Priority | null)[] = [null, "low", "medium", "high", "urgent"];

export const toggleClass = "h-8 rounded-full border px-3 text-sm transition-colors";

export function toggleState(active: boolean) {
  return active ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted";
}

export function Switch({ checked, labelledBy, onChange }: { checked: boolean; labelledBy: string; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      onClick={onChange}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        checked ? "bg-primary" : "bg-muted-foreground/30",
      )}
    >
      <span className={cn("absolute top-1 left-1 size-4 rounded-full bg-white transition-transform", checked && "translate-x-5")} />
    </button>
  );
}

function atHour(daysFromToday: number, hour: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  date.setHours(hour, 0, 0, 0);
  return date;
}

const REMINDER_SHORTCUTS = [
  { label: "En 1 hora", at: () => new Date(Math.ceil(Date.now() / 60_000) * 60_000 + 3_600_000) },
  { label: "Esta tarde (18:00)", at: () => (atHour(0, 18) > new Date() ? atHour(0, 18) : atHour(1, 18)) },
  { label: "Mañana a las 9:00", at: () => atHour(1, 9) },
];

export function PrioritySelect({ value, onChange }: { value: Priority | null; onChange: (priority: Priority | null) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {PRIORITIES.map((priority) => (
        <button
          key={priority ?? "none"}
          type="button"
          aria-pressed={value === priority}
          onClick={() => onChange(priority)}
          className={cn(toggleClass, toggleState(value === priority))}
        >
          {priority ? PRIORITY_LABELS[priority] : "Sin prioridad"}
        </button>
      ))}
    </div>
  );
}

export function TaskStatusSelect({ value, onChange }: { value: TaskStatus; onChange: (status: TaskStatus) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {(Object.keys(TASK_STATUS_LABELS) as TaskStatus[]).map((status) => (
        <button
          key={status}
          type="button"
          aria-pressed={value === status}
          onClick={() => onChange(status)}
          className={cn(toggleClass, toggleState(value === status))}
        >
          {TASK_STATUS_LABELS[status]}
        </button>
      ))}
    </div>
  );
}

export function DueDateInput({ id, task, onChange }: { id: string; task: TaskInput; onChange: (task: TaskInput) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        id={id}
        type="date"
        aria-label="Fecha límite"
        value={task.dueAt ? toDateInput(task.dueAt) : ""}
        onChange={(event) => onChange({ ...task, dueAt: event.target.value ? fromDateInput(event.target.value) : null })}
        className="w-auto"
      />
      {task.dueAt && (
        <Button type="button" variant="ghost" size="sm" onClick={() => onChange({ ...task, dueAt: null })}>
          Quitar fecha
        </Button>
      )}
    </div>
  );
}

export function ReminderInput({ id, value, onChange }: { id: string; value: string | null; onChange: (remindAt: string | null) => void }) {
  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-2">
        {REMINDER_SHORTCUTS.map(({ label, at }) => (
          <button key={label} type="button" onClick={() => onChange(at().toISOString())} className={cn(toggleClass, "hover:bg-muted")}>
            {label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Label htmlFor={id}>Avisarme el</Label>
        <Input
          id={id}
          type="datetime-local"
          value={value ? toDateTimeInput(value) : ""}
          onChange={(event) => onChange(event.target.value ? fromDateTimeInput(event.target.value) : null)}
          className="w-auto"
        />
      </div>
    </div>
  );
}

export function GroupToggles({ value, onToggle }: { value: string[]; onToggle: (groupId: string) => void }) {
  const groups = useGroups();
  if (!groups.data || groups.data.length === 0) return <p className="text-sm text-muted-foreground">Aún no tienes grupos</p>;

  return (
    <div className="flex flex-wrap gap-2">
      {groups.data.map((group) => (
        <button
          key={group.id}
          type="button"
          aria-pressed={value.includes(group.id)}
          onClick={() => onToggle(group.id)}
          className={cn(toggleClass, toggleState(value.includes(group.id)))}
        >
          {group.name}
        </button>
      ))}
    </div>
  );
}
