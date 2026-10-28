import { Link2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PRIORITY_LABELS, toDateInput } from "@/lib/format";
import type { TaskCard } from "@/lib/types";
import { cn } from "@/lib/utils";

export function isOverdue(card: TaskCard) {
  return card.status !== "done" && card.dueAt !== null && toDateInput(card.dueAt) < toDateInput(new Date().toISOString());
}

export function TaskCardView({ card }: { card: TaskCard }) {
  return (
    <div className="grid gap-2 rounded-xl border bg-card p-3 text-left text-sm text-card-foreground shadow-xs">
      <p className={cn("font-medium break-words", card.status === "done" && "text-muted-foreground line-through")}>
        {card.nodex.url && <Link2 className="mr-1 inline size-3.5 text-muted-foreground" aria-hidden="true" />}
        {card.nodex.title}
      </p>
      {(card.nodex.priority || card.dueAt) && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {card.nodex.priority && <Badge variant="secondary">{PRIORITY_LABELS[card.nodex.priority]}</Badge>}
          {card.dueAt && (
            <span className={cn("text-muted-foreground", isOverdue(card) && "font-medium text-destructive")}>
              {new Date(card.dueAt).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
