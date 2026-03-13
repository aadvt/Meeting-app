import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export interface GraphNode {
  id: string;
  label: string;
  type: "decision" | "action_item" | "person" | "risk" | "meeting";
  department: string;
  meeting_id: string;
  timestamp?: number;
  speaker?: string;
  metadata?: Record<string, any>;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface GraphEdge {
  source: string | GraphNode;
  target: string | GraphNode;
  type: "owns" | "related" | "contradiction" | "belongs_to";
  label?: string;
  contradiction_reason?: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  contradictions: Array<{ node_a: string; node_b: string; reason: string }>;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const department = searchParams.get("department") ?? "engineering";
    const meetingId = searchParams.get("meeting_id");

    // Query graph_nodes joined with meetings for department filtering
    let query = supabaseAdmin
      .from("graph_nodes")
      .select("id, meeting_id, node_type, label, metadata, meetings!inner(department)")
      .eq("meetings.department", department)
      .order("created_at", { ascending: true });

    if (meetingId) query = query.eq("meeting_id", meetingId);

    const { data: graphNodesData, error } = await query;
    if (error) throw error;
    if (!graphNodesData || graphNodesData.length === 0) {
      return NextResponse.json({ nodes: [], edges: [], contradictions: [] });
    }

    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    // Build nodes from graph_nodes rows
    for (const row of graphNodesData) {
      const node: GraphNode = {
        id: row.id,
        label: row.label,
        type: row.node_type as GraphNode["type"],
        department,
        meeting_id: row.meeting_id,
        metadata: row.metadata || {},
      };
      nodes.push(node);
    }

    // Build contradiction edges from metadata.contradicts field
    const contradictionEdges: GraphData["contradictions"] = [];

    for (const node of nodes) {
      if (node.metadata?.contradicts) {
        const targetMeetingId = node.metadata.contradicts;
        // Find decision/action node from the target meeting that contradicts this one
        const targetNode = nodes.find(
          (n) =>
            n.meeting_id === targetMeetingId &&
            (n.type === "decision" || n.type === "action_item")
        );
        if (targetNode && targetNode.id !== node.id) {
          contradictionEdges.push({
            node_a: node.id,
            node_b: targetNode.id,
            reason:
              node.metadata.contradiction_reason ||
              "Contradiction detected",
          });
          edges.push({
            source: node.id,
            target: targetNode.id,
            type: "contradiction",
            label: "⚠ conflicts",
            contradiction_reason: node.metadata.contradiction_reason,
          });
        }
      }
    }

    return NextResponse.json({ nodes, edges, contradictions: contradictionEdges } as GraphData);
  } catch (err: any) {
    console.error("[RAG graph error]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
