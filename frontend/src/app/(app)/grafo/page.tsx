"use client";

import { SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { GraphPanel } from "@/components/graph-panel";
import { GraphView } from "@/components/graph-view";
import { NodexDialog } from "@/components/nodex-dialog";
import { Spinner } from "@/components/spinner";
import { TopBar } from "@/components/top-bar";
import { Button } from "@/components/ui/button";
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from "@/lib/graph-settings";
import { toast } from "sonner";
import { useBoard, useRelatedPairs } from "@/lib/queries/board";
import { cn } from "@/lib/utils";

const NO_PAIRS: { a: string; b: string }[] = [];

function download(blob: Blob, extension: string) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `nodex-grafo.${extension}`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href));
}

async function exportGraph(svg: SVGSVGElement, format: "svg" | "png" | "jpeg") {
  const style = getComputedStyle(svg);
  const background = getComputedStyle(document.body).backgroundColor;
  const { width, height } = svg.getBoundingClientRect();
  const source = new XMLSerializer()
    .serializeToString(svg)
    .replaceAll("currentColor", style.color)
    .replace(
      /^<svg([^>]*)>/,
      `<svg$1 width="${width}" height="${height}" font-family="${style.fontFamily.replaceAll('"', "'")}"><rect width="100%" height="100%" fill="${background}"/>`,
    );

  if (format === "svg") return download(new Blob([source], { type: "image/svg+xml" }), "svg");

  const image = new Image();
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`;
  try {
    await image.decode();
  } catch {
    toast.error("No se ha podido exportar la imagen");
    return;
  }
  const canvas = document.createElement("canvas");
  canvas.width = width * 2;
  canvas.height = height * 2;
  const context = canvas.getContext("2d")!;
  context.scale(2, 2);
  context.drawImage(image, 0, 0, width, height);
  canvas.toBlob((blob) => blob && download(blob, format === "png" ? "png" : "jpg"), `image/${format}`, 0.92);
}

export default function GraphPage() {
  const board = useBoard();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [panelOpen, setPanelOpen] = useState<boolean | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const related = useRelatedPairs(settings.related);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSettings(loadSettings());
    });
    return () => clearTimeout(timer);
  }, []);

  function changeSettings(next: typeof settings) {
    setSettings(next);
    saveSettings(next);
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl min-w-0 flex-1 flex-col gap-4">
      <TopBar location="Vista gráfica" />
      <div className="relative h-[calc(100dvh-9rem)] min-h-96 overflow-hidden rounded-3xl border bg-card md:h-[calc(100dvh-6rem)]">
        {board.isPending && <Spinner className="absolute inset-0 m-auto size-8 text-primary" />}
        {board.isError && (
          <div className="absolute inset-0 grid place-content-center justify-items-center gap-3 text-center">
            <p className="text-muted-foreground">No se ha podido cargar el grafo</p>
            <Button variant="outline" onClick={() => board.refetch()}>
              Reintentar
            </Button>
          </div>
        )}
        {board.data && board.data.nodexs.length === 0 && (
          <div className="absolute inset-0 grid place-content-center justify-items-center gap-3 text-center">
            <p className="text-muted-foreground">Aún no hay nada que conectar</p>
            <Button variant="outline" asChild>
              <Link href="/">Crear Nodexs en el panel</Link>
            </Button>
          </div>
        )}
        {board.data && board.data.nodexs.length > 0 && (
          <GraphView
            groups={board.data.groups}
            nodexs={board.data.nodexs}
            pairs={related.data ?? NO_PAIRS}
            settings={settings}
            svgRef={svgRef}
            onOpenNodex={setOpenId}
          />
        )}
        {panelOpen !== false && (
          <GraphPanel
            className={panelOpen === null ? "hidden md:block" : undefined}
            settings={settings}
            onChange={changeSettings}
            groups={board.data?.groups ?? []}
            onExport={(format) => svgRef.current && exportGraph(svgRef.current, format)}
            onClose={() => setPanelOpen(false)}
          />
        )}
        {panelOpen !== true && (
          <Button
            variant="outline"
            size="icon-lg"
            aria-label="Abrir ajustes del grafo"
            className={cn("absolute top-3 right-3 z-10 bg-card", panelOpen === null && "md:hidden")}
            onClick={() => setPanelOpen(true)}
          >
            <SlidersHorizontal />
          </Button>
        )}
      </div>
      <NodexDialog id={openId} open={openId !== null} onOpenChange={(open) => !open && setOpenId(null)} onOpenNodex={setOpenId} />
    </div>
  );
}
