import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { geminiFlash } from "@/lib/gemini";

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

    let query = supabaseAdmin
      .from("meeting_chunks")
      .select("id, meeting_id, content, chunk_type, speaker, timestamp, metadata, created_at")
      .eq("department", department)
      .order("created_at", { ascending: true });

    if (meetingId) query = query.eq("meeting_id", meetingId);

    const { data: chunks, error } = await query;
    if (error) throw error;
    if (!chunks || chunks.length === 0) {
      return NextResponse.json({ nodes: [], edges: [], contradictions: [] });
    }

    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const personsSeen = new Set<string>();
    const meetingsSeen = new Set<string>();

    for (const chunk of chunks) {
      if (!meetingsSeen.has(chunk.meeting_id)) {
        meetingsSeen.add(chunk.meeting_id);
        nodes.push({ id: `meeting:${chunk.meeting_id}`, label: `Meeting ${chunk.meeting_id.slice(-4)}`, type: "meeting", department, meeting_id: chunk.meeting_id });
      }
    }

    for (const chunk of chunks) {
      const nodeId = `chunk:${chunk.id}`;
      nodes.push({ id: nodeId, label: chunk.content.length > 60 ? chunk.content.slice(0, 57) + "…" : chunk.content, type: chunk.chunk_type as GraphNode["type"], department, meeting_id: chunk.meeting_id, timestamp: chunk.timestamp, speaker: chunk.speaker, metadata: chunk.metadata });
      edges.push({ source: `meeting:${chunk.meeting_id}`, target: nodeId, type: "belongs_to" });
      if (chunk.speaker) {
        const personId = `person:${chunk.speaker.toLowerCase().replace(/\s+/g, "_")}`;
        if (!personsSeen.has(personId)) {
          personsSeen.add(personId);
          nodes.push({ id: personId, label: chunk.speaker, type: "person", department, meeting_id: chunk.meeting_id });
        }
        edges.push({ source: personId, target: nodeId, type: "owns" });
      }
    }

    const decisions = chunks.filter((c) => c.chunk_type === "decision");
    const contradictionEdges: GraphData["contradictions"] = [];

    if (decisions.length >= 2) {
      const decisionList = decisions.map((d, i) => `[${i}] ID:${d.id} — ${d.content}`).join("\n");
      const prompt = `Analyze these decisions and find any that directly contradict each other.\n\nDECISIONS:\n${decisionList}\n\nReturn ONLY valid JSON array (no markdown):\n[{"index_a": 0, "index_b": 1, "reason": "short explanation"}]\n\nReturn [] if no contradictions.`;
      try {
        const resp = await geminiFlash.generateContent(prompt);
        const raw = resp.response.text().trim().replace(/^```json|```$/g, "").trim();
        const conflicts: Array<{ index_a: number; index_b: number; reason: string }> = JSON.parse(raw);
        for (const conflict of conflicts) {
          const nodeA = `chunk:${decisions[conflict.index_a]?.id}`;
          const nodeB = `chunk:${decisions[conflict.index_b]?.id}`;
          if (!nodeA || !nodeB) continue;
          contradictionEdges.push({ node_a: nodeA, node_b: nodeB, reason: conflict.reason });
          edges.push({ source: nodeA, target: nodeB, type: "contradiction", label: "⚠ conflicts", contradiction_reason: conflict.reason });
        }
      } catch { /* contradiction detection is best-effort */ }
    }

    return NextResponse.json({ nodes, edges, contradictions: contradictionEdges } as GraphData);
  } catch (err: any) {
    console.error("[RAG graph error]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
