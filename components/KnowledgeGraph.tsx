"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";

interface GraphNode {
  id: string; label: string;
  type: "decision" | "action_item" | "person" | "risk" | "meeting";
  department: string; meeting_id: string;
  timestamp?: number; speaker?: string; metadata?: Record<string, any>;
  x?: number; y?: number; vx?: number; vy?: number; fx?: number | null; fy?: number | null;
}
interface GraphEdge {
  source: string | GraphNode; target: string | GraphNode;
  type: "owns" | "related" | "contradiction" | "belongs_to";
  label?: string; contradiction_reason?: string;
}
interface GraphData {
  nodes: GraphNode[]; edges: GraphEdge[];
  contradictions: Array<{ node_a: string; node_b: string; reason: string }>;
}

const NODE_CONFIG = {
  decision: { color: "#F59E0B", radius: 22, label: "Decision" },
  action_item: { color: "#3B82F6", radius: 18, label: "Action" },
  person: { color: "#10B981", radius: 20, label: "Person" },
  risk: { color: "#EF4444", radius: 16, label: "Risk" },
  meeting: { color: "#8B5CF6", radius: 26, label: "Meeting" },
} as const;

const EDGE_CONFIG = {
  owns: { color: "#4B5563", width: 1.5, dash: "none" },
  related: { color: "#374151", width: 1, dash: "4,4" },
  contradiction: { color: "#EF4444", width: 2.5, dash: "none" },
  belongs_to: { color: "#1F2937", width: 1, dash: "2,6" },
} as const;

interface KnowledgeGraphProps {
  department?: string; meetingId?: string; height?: number; className?: string;
}

export default function KnowledgeGraph({ department = "engineering", meetingId, height = 600, className = "" }: KnowledgeGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<GraphEdge | null>(null);
  const [filterType, setFilterType] = useState<string>("all");

  const fetchGraph = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams({ department });
      if (meetingId) params.set("meeting_id", meetingId);
      const res = await fetch(`/api/rag/graph?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setGraphData(data);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [department, meetingId]);

  useEffect(() => { fetchGraph(); }, [fetchGraph]);

  useEffect(() => {
    if (!graphData || !svgRef.current || !containerRef.current) return;
    const width = containerRef.current.clientWidth;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const visibleNodes = filterType === "all" ? graphData.nodes : graphData.nodes.filter((n) => n.type === filterType || n.type === "meeting");
    const visibleNodeIds = new Set(visibleNodes.map((n) => n.id));
    const visibleEdges = graphData.edges.filter((e) => visibleNodeIds.has(typeof e.source === "string" ? e.source : (e.source as GraphNode).id) && visibleNodeIds.has(typeof e.target === "string" ? e.target : (e.target as GraphNode).id));
    const nodes: GraphNode[] = visibleNodes.map((n) => ({ ...n }));
    const edges: GraphEdge[] = visibleEdges.map((e) => ({ ...e }));

    const defs = svg.append("defs");
    const filter = defs.append("filter").attr("id", "glow").attr("x", "-50%").attr("y", "-50%").attr("width", "200%").attr("height", "200%");
    filter.append("feGaussianBlur").attr("stdDeviation", "4").attr("result", "coloredBlur");
    const fm = filter.append("feMerge"); fm.append("feMergeNode").attr("in", "coloredBlur"); fm.append("feMergeNode").attr("in", "SourceGraphic");
    const cf = defs.append("filter").attr("id", "contra-glow").attr("x", "-100%").attr("y", "-100%").attr("width", "300%").attr("height", "300%");
    cf.append("feGaussianBlur").attr("stdDeviation", "6").attr("result", "coloredBlur");
    const fm2 = cf.append("feMerge"); fm2.append("feMergeNode").attr("in", "coloredBlur"); fm2.append("feMergeNode").attr("in", "SourceGraphic");
    (["owns", "related", "contradiction", "belongs_to"] as const).forEach((type) => {
      defs.append("marker").attr("id", `arrow-${type}`).attr("viewBox", "0 -5 10 10").attr("refX", 28).attr("refY", 0).attr("markerWidth", 6).attr("markerHeight", 6).attr("orient", "auto")
        .append("path").attr("d", "M0,-5L10,0L0,5").attr("fill", EDGE_CONFIG[type].color);
    });

    const g = svg.append("g").attr("class", "graph-root");
    svg.call(d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.2, 3]).on("zoom", (event) => g.attr("transform", event.transform))).on("dblclick.zoom", null);

    const edgeEl = g.append("g").selectAll<SVGLineElement, GraphEdge>("line").data(edges).join("line")
      .attr("stroke", (d) => EDGE_CONFIG[d.type].color).attr("stroke-width", (d) => EDGE_CONFIG[d.type].width)
      .attr("stroke-dasharray", (d) => EDGE_CONFIG[d.type].dash).attr("marker-end", (d) => `url(#arrow-${d.type})`)
      .attr("filter", (d) => d.type === "contradiction" ? "url(#contra-glow)" : "none")
      .style("cursor", (d) => d.type === "contradiction" ? "pointer" : "default")
      .on("mouseenter", function (_, d) { if (d.type === "contradiction") { d3.select(this).attr("stroke-width", 4); setHoveredEdge(d); } })
      .on("mouseleave", function (_, d) { d3.select(this).attr("stroke-width", EDGE_CONFIG[d.type].width); setHoveredEdge(null); });

    const nodeEl = g.append("g").selectAll<SVGGElement, GraphNode>("g").data(nodes, (d) => d.id).join("g")
      .style("cursor", "pointer")
      .call(d3.drag<SVGGElement, GraphNode>()
        .on("start", (event, d) => { if (!event.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on("drag", (event, d) => { d.fx = event.x; d.fy = event.y; })
        .on("end", (event, d) => { if (!event.active) sim.alphaTarget(0); d.fx = null; d.fy = null; }))
      .on("click", (_, d) => setSelected((prev) => prev?.id === d.id ? null : d));

    nodeEl.filter((d) => d.type === "decision").append("circle").attr("r", NODE_CONFIG.decision.radius + 8).attr("fill", "none")
      .attr("stroke", NODE_CONFIG.decision.color).attr("stroke-width", 1).attr("stroke-opacity", 0.3)
      .append("animate").attr("attributeName", "r").attr("values", `${NODE_CONFIG.decision.radius + 6};${NODE_CONFIG.decision.radius + 14};${NODE_CONFIG.decision.radius + 6}`).attr("dur", "3s").attr("repeatCount", "indefinite");

    nodeEl.append("circle").attr("r", (d) => NODE_CONFIG[d.type].radius).attr("fill", (d) => NODE_CONFIG[d.type].color + "22")
      .attr("stroke", (d) => NODE_CONFIG[d.type].color).attr("stroke-width", 2).attr("filter", "url(#glow)");

    const icons: Record<string, string> = { decision: "⚖", action_item: "✓", person: "◎", risk: "⚠", meeting: "◈" };
    nodeEl.append("text").attr("text-anchor", "middle").attr("dominant-baseline", "central").attr("font-size", (d) => d.type === "meeting" ? "14px" : "12px").attr("fill", (d) => NODE_CONFIG[d.type].color).text((d) => icons[d.type] ?? "○");
    nodeEl.append("text").attr("text-anchor", "middle").attr("y", (d) => NODE_CONFIG[d.type].radius + 14).attr("font-size", "10px").attr("font-family", "monospace").attr("fill", "#9CA3AF").attr("pointer-events", "none").text((d) => d.label.length > 22 ? d.label.slice(0, 20) + "…" : d.label);

    const sim = d3.forceSimulation<GraphNode>(nodes)
      .force("link", d3.forceLink<GraphNode, GraphEdge>(edges).id((d) => d.id).distance((d) => d.type === "contradiction" ? 220 : d.type === "belongs_to" ? 120 : 160).strength((d) => d.type === "belongs_to" ? 0.8 : 0.4))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide<GraphNode>().radius((d) => NODE_CONFIG[d.type].radius + 20))
      .on("tick", () => {
        edgeEl.attr("x1", (d) => (d.source as GraphNode).x ?? 0).attr("y1", (d) => (d.source as GraphNode).y ?? 0).attr("x2", (d) => (d.target as GraphNode).x ?? 0).attr("y2", (d) => (d.target as GraphNode).y ?? 0);
        nodeEl.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
      });
    return () => sim.stop();
  }, [graphData, filterType, height]);

  const contradictionCount = graphData?.contradictions.length ?? 0;
  const totalNodes = graphData?.nodes.length ?? 0;

  return (
    <div className={`relative flex flex-col bg-gray-950 rounded-xl border border-gray-800 overflow-hidden ${className}`} style={{ height }}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900/50 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-gray-400 uppercase tracking-widest">Knowledge Graph</span>
          <span className="text-xs font-mono text-purple-400 bg-purple-950/50 px-2 py-0.5 rounded-full">{department}</span>
          {contradictionCount > 0 && <span className="text-xs font-mono text-red-400 bg-red-950/50 px-2 py-0.5 rounded-full animate-pulse">⚠ {contradictionCount} conflict{contradictionCount > 1 ? "s" : ""}</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600">{totalNodes} nodes</span>
          <button onClick={fetchGraph} className="text-xs text-gray-500 hover:text-gray-300 transition-colors px-2 py-1 rounded border border-gray-700 hover:border-gray-500">↻ refresh</button>
        </div>
      </div>
      <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-800/50 flex-shrink-0 overflow-x-auto">
        {["all", "decision", "action_item", "person", "risk"].map((type) => (
          <button key={type} onClick={() => setFilterType(type)} className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono transition-all whitespace-nowrap ${filterType === type ? "bg-gray-700 text-white" : "text-gray-500 hover:text-gray-300"}`}>
            {type !== "all" && <span className="w-2 h-2 rounded-full" style={{ background: NODE_CONFIG[type as keyof typeof NODE_CONFIG]?.color }} />}
            {type === "all" ? "All" : NODE_CONFIG[type as keyof typeof NODE_CONFIG]?.label ?? type}
          </button>
        ))}
      </div>
      <div ref={containerRef} className="flex-1 relative">
        {loading && <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-950/80 z-10"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /><span className="text-xs font-mono text-gray-500">Building knowledge graph…</span></div>}
        {error && <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10"><span className="text-red-400 text-sm font-mono">⚠ {error}</span><button onClick={fetchGraph} className="text-xs text-gray-400 hover:text-white border border-gray-700 px-3 py-1.5 rounded">retry</button></div>}
        {!loading && !error && totalNodes === 0 && <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10"><span className="text-gray-600 text-4xl">◎</span><span className="text-gray-500 text-sm font-mono">No graph data yet</span><span className="text-gray-600 text-xs">Run the seed script or ingest a meeting first</span></div>}
        <svg ref={svgRef} width="100%" height="100%" className="block" style={{ background: "transparent" }} />
        {hoveredEdge?.type === "contradiction" && <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-red-950/90 border border-red-800 rounded-lg px-4 py-2 max-w-xs text-xs text-red-200 font-mono pointer-events-none z-20"><span className="text-red-400 font-bold">⚠ Conflict: </span>{hoveredEdge.contradiction_reason}</div>}
      </div>
      {selected && (
        <div className="absolute bottom-4 right-4 w-72 bg-gray-900 border border-gray-700 rounded-xl p-4 shadow-2xl z-20">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ background: NODE_CONFIG[selected.type]?.color }} /><span className="text-xs font-mono text-gray-400 uppercase">{selected.type.replace("_", " ")}</span></div>
            <button onClick={() => setSelected(null)} className="text-gray-600 hover:text-gray-300 text-xs">✕</button>
          </div>
          <p className="text-sm text-gray-200 leading-relaxed mb-3">{selected.label}</p>
          <div className="space-y-1.5 text-xs font-mono text-gray-500">
            {selected.speaker && <div className="flex justify-between"><span>Owner</span><span className="text-green-400">{selected.speaker}</span></div>}
            {selected.timestamp !== undefined && <div className="flex justify-between"><span>Timestamp</span><span className="text-blue-400">{Math.floor(selected.timestamp / 60)}m {selected.timestamp % 60}s</span></div>}
            <div className="flex justify-between"><span>Meeting</span><span className="text-purple-400">{selected.meeting_id.slice(-8)}</span></div>
            {selected.metadata?.due_date && <div className="flex justify-between"><span>Due</span><span className="text-amber-400">{selected.metadata.due_date}</span></div>}
          </div>
        </div>
      )}
      <div className="absolute bottom-4 left-4 flex flex-col gap-1.5 bg-gray-900/80 backdrop-blur rounded-lg p-3 border border-gray-800">
        {Object.entries(NODE_CONFIG).map(([type, cfg]) => <div key={type} className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: cfg.color }} /><span className="text-xs font-mono text-gray-500">{cfg.label}</span></div>)}
        <div className="flex items-center gap-2 mt-1 pt-1.5 border-t border-gray-700"><span className="w-5 h-0.5 bg-red-500" style={{ boxShadow: "0 0 4px #EF4444" }} /><span className="text-xs font-mono text-red-500">Conflict</span></div>
      </div>
    </div>
  );
}
