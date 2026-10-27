"use client";

import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type Simulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";
import { select } from "d3-selection";
import { zoom, zoomIdentity, type ZoomTransform } from "d3-zoom";
import { useEffect, useMemo, useRef, useState } from "react";
import { NodexCard } from "@/components/nodex-card";
import { Button } from "@/components/ui/button";
import { matchesRule, type GraphSettings } from "@/lib/graph-settings";
import type { Group, Nodex } from "@/lib/types";

type GraphNode = SimulationNodeDatum & {
  id: string;
  kind: "group" | "nodex" | "tag";
  label: string;
  r: number;
  nodex?: Nodex;
};

type GraphLink = SimulationLinkDatum<GraphNode> & { kind: "member" | "tag" | "related" };

const GROUP_COLOR = "#ffa247";
const TAG_COLOR = "#8b8b8b";
const NODEX_COLOR = "#a3a3a3";

type GraphViewProps = {
  groups: Group[];
  nodexs: Nodex[];
  pairs: { a: string; b: string }[];
  settings: GraphSettings;
  svgRef: React.RefObject<SVGSVGElement | null>;
  onOpenNodex: (id: string) => void;
};

type GraphFilters = Pick<GraphSettings, "search" | "showTags" | "showOrphans" | "hiddenGroups" | "related">;

function buildGraph(groups: Group[], nodexs: Nodex[], pairs: GraphViewProps["pairs"], s: GraphFilters) {
  const q = s.search.trim().toLowerCase();
  const visibleGroups = groups.filter((g) => !s.hiddenGroups.includes(g.id));
  const visibleGroupIds = new Set(visibleGroups.map((g) => g.id));
  const shown = nodexs.filter(
    (n) =>
      (!q || n.title.toLowerCase().includes(q) || n.tags.some((t) => t.includes(q))) &&
      (n.groupIds.some((id) => visibleGroupIds.has(id)) || (n.groupIds.length === 0 && s.showOrphans)),
  );
  const shownIds = new Set(shown.map((n) => n.id));

  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];

  for (const g of visibleGroups) {
    if (q && !shown.some((n) => n.groupIds.includes(g.id))) continue;
    nodes.push({ id: `g:${g.id}`, kind: "group", label: g.name, r: 12 });
  }
  const groupNodeIds = new Set(nodes.map((n) => n.id));

  const tagNames = new Set<string>();
  for (const n of shown) {
    nodes.push({ id: n.id, kind: "nodex", label: n.title, r: 5, nodex: n });
    for (const id of n.groupIds) {
      if (groupNodeIds.has(`g:${id}`)) links.push({ source: n.id, target: `g:${id}`, kind: "member" });
    }
    if (s.showTags) {
      for (const t of n.tags) {
        tagNames.add(t);
        links.push({ source: n.id, target: `t:${t}`, kind: "tag" });
      }
    }
  }
  for (const t of tagNames) nodes.push({ id: `t:${t}`, kind: "tag", label: `#${t}`, r: 4 });

  if (s.related) {
    for (const { a, b } of pairs) {
      if (shownIds.has(a) && shownIds.has(b)) links.push({ source: a, target: b, kind: "related" });
    }
  }
  return { nodes, links };
}

function endPoint(link: GraphLink, size: number) {
  const source = link.source as GraphNode;
  const target = link.target as GraphNode;
  const dx = (target.x ?? 0) - (source.x ?? 0);
  const dy = (target.y ?? 0) - (source.y ?? 0);
  const length = Math.hypot(dx, dy) || 1;
  const gap = target.r * size + 3;
  return { x: (target.x ?? 0) - (dx / length) * gap, y: (target.y ?? 0) - (dy / length) * gap };
}

export function GraphView({ groups, nodexs, pairs, settings, svgRef, onOpenNodex }: GraphViewProps) {
  const { search, showTags, showOrphans, hiddenGroups, related, rules, nodeSize } = settings;
  const [positions] = useState(() => new Map<string, { x: number; y: number }>());
  const graph = useMemo(() => {
    const built = buildGraph(groups, nodexs, pairs, { search, showTags, showOrphans, hiddenGroups, related });
    for (const node of built.nodes) Object.assign(node, positions.get(node.id));
    return built;
  }, [groups, nodexs, pairs, search, showTags, showOrphans, hiddenGroups, related, positions]);
  const colors = useMemo(() => {
    const groupName = new Map(groups.map((g) => [g.id, g.name]));
    return new Map(
      nodexs.map((n) => {
        const names = n.groupIds.map((id) => groupName.get(id) ?? "");
        return [n.id, rules.find((r) => matchesRule(r.query, n, names))?.color ?? NODEX_COLOR];
      }),
    );
  }, [groups, nodexs, rules]);
  const simulation = useRef<Simulation<GraphNode, GraphLink> | null>(null);
  const [, setTick] = useState(0);
  const [transform, setTransform] = useState<ZoomTransform>(zoomIdentity);
  const [preview, setPreview] = useState<{ nodex: Nodex; x: number; y: number; touch: boolean } | null>(null);
  const drag = useRef<{ node: GraphNode; moved: boolean; startX: number; startY: number } | null>(null);

  useEffect(() => {
    const settled = graph.nodes.every((node) => positions.has(node.id));
    const sim = forceSimulation(graph.nodes)
      .alpha(settled ? 0.3 : 1)
      .force(
        "link",
        forceLink<GraphNode, GraphLink>(graph.links)
          .id((d) => d.id)
          .distance((l) => (l.kind === "related" ? 90 : 50))
          .strength((l) => (l.kind === "related" ? 0.05 : 0.6)),
      )
      .force("charge", forceManyBody().strength(-90))
      .force("collide", forceCollide<GraphNode>((d) => d.r + 2))
      .force("x", forceX(0).strength(0.04))
      .force("y", forceY(0).strength(0.04))
      .on("tick", () => {
        for (const node of graph.nodes) positions.set(node.id, { x: node.x ?? 0, y: node.y ?? 0 });
        setTick((tick) => tick + 1);
      });
    simulation.current = sim;
    return () => {
      sim.stop();
    };
  }, [graph, positions]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const behavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .filter(
        (event) =>
          (event.type === "wheel" || !(event.target as Element).closest("[data-node]")) && (!event.ctrlKey || event.type === "wheel") && !event.button,
      )
      .on("zoom", (event) => setTransform(event.transform));
    select(svg).call(behavior);
    let centered = false;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (centered || width === 0) return;
      centered = true;
      select(svg).call(behavior.transform, zoomIdentity.translate(width / 2, height / 2));
    });
    observer.observe(svg);
    return () => {
      observer.disconnect();
      select(svg).on(".zoom", null);
    };
  }, [svgRef]);

  function pointerToGraph(event: React.PointerEvent) {
    const rect = svgRef.current!.getBoundingClientRect();
    return transform.invert([event.clientX - rect.left, event.clientY - rect.top]);
  }

  function onPointerDown(event: React.PointerEvent, node: GraphNode) {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { node, moved: false, startX: event.clientX, startY: event.clientY };
  }

  function onPointerMove(event: React.PointerEvent) {
    if (!drag.current) return;
    const { node, startX, startY } = drag.current;
    if (!drag.current.moved && Math.hypot(event.clientX - startX, event.clientY - startY) < 5) return;
    drag.current.moved = true;
    const [x, y] = pointerToGraph(event);
    node.fx = x;
    node.fy = y;
    setPreview(null);
    simulation.current?.alphaTarget(0.3).restart();
  }

  function endDrag() {
    const current = drag.current;
    drag.current = null;
    if (!current) return null;
    current.node.fx = null;
    current.node.fy = null;
    simulation.current?.alphaTarget(0);
    return current;
  }

  function onPointerUp(event: React.PointerEvent) {
    const current = endDrag();
    if (!current) return;
    const nodex = current.node.nodex;
    if (current.moved || !nodex) return;
    if (event.pointerType === "mouse") onOpenNodex(nodex.id);
    else setPreview({ nodex, x: event.clientX, y: event.clientY, touch: true });
  }

  return (
    <div className="relative size-full">
      <svg
        ref={svgRef}
        role="group"
        aria-label="Vista gráfica de tus Nodexs"
        className="size-full touch-none text-foreground select-none" onClick={(e) => e.target === e.currentTarget && setPreview(null)}>
        <defs>
          <marker id="graph-arrow" viewBox="0 0 10 10" refX={9} refY={5} markerWidth={6} markerHeight={6} orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="currentColor" fillOpacity={0.5} />
          </marker>
        </defs>
        <g transform={transform.toString()}>
          {graph.links.map((link, i) => {
            if (typeof link.source !== "object") return null;
            const source = link.source as GraphNode;
            const end = endPoint(link, nodeSize);
            return (
              <line
                key={i}
                x1={source.x}
                y1={source.y}
                x2={end.x}
                y2={end.y}
                stroke="currentColor"
                strokeOpacity={link.kind === "related" ? 0.5 : 0.3}
                strokeWidth={settings.lineWidth}
                strokeDasharray={link.kind === "related" ? "4 3" : undefined}
                markerEnd={settings.arrows && link.kind !== "related" ? "url(#graph-arrow)" : undefined}
              />
            );
          })}
          {graph.nodes.map((node) => (
            <g key={node.id} transform={`translate(${node.x ?? 0},${node.y ?? 0})`}>
              <circle
                data-node
                r={node.r * nodeSize}
                fill={node.kind === "group" ? GROUP_COLOR : node.kind === "tag" ? TAG_COLOR : colors.get(node.id)}
                className={node.nodex ? "cursor-pointer focus-visible:outline-2 focus-visible:outline-primary" : "cursor-grab"}
                tabIndex={node.nodex ? 0 : undefined}
                role={node.nodex ? "button" : undefined}
                aria-label={node.nodex ? node.label : undefined}
                onKeyDown={(e) => {
                  if (node.nodex && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    onOpenNodex(node.id);
                  }
                }}
                onPointerDown={(e) => onPointerDown(e, node)}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={endDrag}
                onLostPointerCapture={endDrag}
                onPointerEnter={(e) => node.nodex && e.pointerType === "mouse" && setPreview({ nodex: node.nodex, x: e.clientX, y: e.clientY, touch: false })}
                onPointerLeave={(e) => e.pointerType === "mouse" && setPreview(null)}
              >
                <title>{node.label}</title>
              </circle>
              {node.kind !== "nodex" && (
                <text y={node.r * nodeSize + 13} textAnchor="middle" fontSize={node.kind === "group" ? 12 : 10} fill="currentColor" fillOpacity={0.8} pointerEvents="none">
                  {node.label}
                </text>
              )}
            </g>
          ))}
        </g>
      </svg>

      {preview && (
        <div
          className={preview.touch ? "absolute inset-x-3 bottom-3 z-20 grid gap-2" : "pointer-events-none fixed z-50 w-72"}
          style={preview.touch ? undefined : { left: Math.min(preview.x + 16, innerWidth - 304), top: Math.min(preview.y + 16, innerHeight - 336) }}
        >
          <div className={preview.touch ? "max-h-60 overflow-hidden" : "max-h-80 overflow-hidden"} inert>
            <NodexCard nodex={preview.nodex} groups={groups} onOpen={() => {}} />
          </div>
          {preview.touch && (
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPreview(null)}>
                Cerrar
              </Button>
              <Button onClick={() => onOpenNodex(preview.nodex.id)}>Abrir</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
