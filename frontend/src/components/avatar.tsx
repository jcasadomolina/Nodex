import { cn } from "@/lib/utils";

export function Avatar({ name, url, className }: { name: string; url: string | null; className?: string }) {
  return (
    <span className={cn("grid shrink-0 place-content-center overflow-hidden rounded-full bg-primary font-semibold text-primary-foreground", className)}>
      {url ? <img src={url} alt="" className="size-full object-cover" /> : [...name.trim()][0]?.toUpperCase()}
    </span>
  );
}
