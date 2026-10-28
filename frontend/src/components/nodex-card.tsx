import { Link2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { domainOf, PRIORITY_LABELS } from "@/lib/format";
import type { Group, Nodex, Task } from "@/lib/types";

function taskLabel(task: Task) {
  if (task.status === "done") return "Hecha";
  if (!task.dueAt) return "Tarea";
  return `Tarea · ${new Date(task.dueAt).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}`;
}

type NodexCardProps = {
  nodex: Nodex;
  groups: Group[];
  onOpen: (id: string) => void;
};

export function NodexCard({ nodex, groups, onOpen }: NodexCardProps) {
  const groupNames = groups.filter((g) => nodex.groupIds.includes(g.id)).map((g) => g.name);
  const image = nodex.linkPreview?.imageUrl;
  const urgent = nodex.priority === "urgent" || nodex.priority === "high";

  return (
    <button
      type="button"
      onClick={() => onOpen(nodex.id)}
      aria-label={nodex.title}
      className="mb-4 grid w-full break-inside-avoid gap-2 overflow-hidden rounded-2xl border bg-card p-4 text-left text-card-foreground transition-shadow hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      {image && (
        <img src={image} alt="" loading="lazy" className="-mx-4 -mt-4 mb-1 max-h-48 w-[calc(100%+2rem)] max-w-none object-cover" />
      )}
      <h3 className="font-medium break-words">{nodex.title}</h3>
      {nodex.content && <p className="line-clamp-8 text-sm break-words whitespace-pre-line text-muted-foreground">{nodex.content}</p>}
      {nodex.url && (
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <Link2 className="size-3.5" />
          {domainOf(nodex.url)}
        </p>
      )}
      {nodex.tags.length > 0 && <p className="text-xs font-medium text-primary">{nodex.tags.map((t) => `#${t}`).join(" ")}</p>}
      {(nodex.priority || nodex.task || groupNames.length > 0) && (
        <div className="flex flex-wrap gap-1">
          {nodex.task && <Badge variant="secondary">{taskLabel(nodex.task)}</Badge>}
          {nodex.priority && <Badge variant={urgent ? "default" : "secondary"}>{PRIORITY_LABELS[nodex.priority]}</Badge>}
          {groupNames.map((name) => (
            <Badge key={name} variant="outline">
              {name}
            </Badge>
          ))}
        </div>
      )}
    </button>
  );
}
