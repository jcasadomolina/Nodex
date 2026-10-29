import { ArrowUpRight, Bell, Clock, Link2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { domainOf, formatDateTime, PRIORITY_LABELS } from "@/lib/format";
import type { Group, Nodex, Task } from "@/lib/types";

function taskLabel(task: Task) {
  if (task.status === "done") return "Hecha";
  if (!task.dueAt) return "Tarea";
  return `Tarea · ${new Date(task.dueAt).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}`;
}

type NodexCardProps = {
  nodex: Nodex;
  groups: Group[];
  index?: number;
  onOpen: (id: string) => void;
};

export function NodexCard({ nodex, groups, index = 0, onOpen }: NodexCardProps) {
  const groupNames = groups.filter((g) => nodex.groupIds.includes(g.id)).map((g) => g.name);
  const image = nodex.linkPreview?.imageUrl;
  const urgent = nodex.priority === "urgent" || nodex.priority === "high";
  const pendingReminder = nodex.reminder !== null && nodex.reminder.sentAt === null;
  const broken = nodex.linkPreview?.status === "broken";

  return (
    <article
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
      className="lift relative mb-4 grid w-full break-inside-avoid gap-2 overflow-hidden rounded-2xl border bg-card p-4 text-card-foreground animate-in fade-in slide-in-from-bottom-2 fill-mode-both has-[button:focus-visible]:ring-3 has-[button:focus-visible]:ring-ring/50"
    >
      {image && (
        <img src={image} alt="" loading="lazy" className="-mx-4 -mt-4 mb-1 max-h-48 w-[calc(100%+2rem)] max-w-none object-cover" />
      )}
      <h3 className="font-medium break-words">
        <button type="button" onClick={() => onOpen(nodex.id)} className="text-left outline-none after:absolute after:inset-0">
          {nodex.title}
        </button>
      </h3>
      {nodex.content && <p className="line-clamp-8 text-sm break-words whitespace-pre-line text-muted-foreground">{nodex.content}</p>}
      {nodex.url && (
        <p className="flex flex-wrap items-center gap-x-1 text-xs text-muted-foreground">
          <a
            href={nodex.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Abrir ${domainOf(nodex.url)} en una pestaña nueva`}
            className="relative z-10 -my-1 inline-flex items-center gap-1 rounded-full py-1 pr-1.5 transition-colors hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <Link2 className="size-3.5" />
            {domainOf(nodex.url)}
            <ArrowUpRight className="size-3" aria-hidden="true" />
          </a>
          {nodex.linkPreview?.readingMinutes && (
            <span className="inline-flex items-center gap-1 whitespace-nowrap">
              <span aria-hidden="true">·</span>
              <Clock className="size-3.5" aria-hidden="true" />
              {nodex.linkPreview.readingMinutes} min de lectura
            </span>
          )}
        </p>
      )}
      {nodex.tags.length > 0 && <p className="text-xs font-medium text-primary">{nodex.tags.map((t) => `#${t}`).join(" ")}</p>}
      {(nodex.priority || nodex.task || nodex.readLaterAt || pendingReminder || broken || groupNames.length > 0) && (
        <div className="flex flex-wrap gap-1">
          {nodex.readLaterAt && <Badge variant="secondary">Para leer</Badge>}
          {broken && <Badge variant="destructive">Enlace roto</Badge>}
          {pendingReminder && (
            <Badge variant="secondary">
              <Bell aria-hidden="true" />
              <span className="sr-only">Recordatorio:</span> {formatDateTime(nodex.reminder!.remindAt)}
            </Badge>
          )}
          {nodex.task && <Badge variant="secondary">{taskLabel(nodex.task)}</Badge>}
          {nodex.priority && <Badge variant={urgent ? "default" : "secondary"}>{PRIORITY_LABELS[nodex.priority]}</Badge>}
          {groupNames.map((name) => (
            <Badge key={name} variant="outline">
              {name}
            </Badge>
          ))}
        </div>
      )}
    </article>
  );
}
