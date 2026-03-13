import { supabaseAdmin } from './supabase'
import { geminiFlash, embedText } from './gemini'

export type ChunkType = 'decision' | 'action_item' | 'discussion'

export interface MeetingChunk {
    meeting_id: string
    department: string
    content: string
    chunk_type: ChunkType
    speaker?: string
    timestamp?: number
    embedding: number[]
    metadata?: Record<string, any>
}

export interface ExtractedMeeting {
    decisions: Array<{ text: string; owner?: string; timestamp?: number }>
    action_items: Array<{ text: string; assignee?: string; due_date?: string; timestamp?: number }>
    risks: Array<{ text: string; severity: 'low' | 'medium' | 'high' }>
    contradictions: Array<{ new_decision: string; conflicts_with: string; reason: string }>
}

// Retrieve top-k relevant past chunks from pgvector
export async function retrieve(
    query: string,
    department: string,
    topK = 3
): Promise<Array<{ content: string; chunk_type: string; similarity: number }>> {
    console.log('RAG: Testing gemini-1.5-flash connection...')
    try {
        const testResp = await geminiFlash.generateContent('hi')
        console.log('RAG: Gemini Flash test success:', testResp.response.text().slice(0, 10))
    } catch (err: any) {
        console.error('RAG: Gemini Flash test FAILED:', err.message)
    }

    console.log('RAG: Retrieving for query:', query.slice(0, 50), 'dept:', department)
    const queryEmbedding = await embedText(query)
    console.log('RAG: Embedding generated successfully')
    const { data, error } = await supabaseAdmin.rpc('match_chunks', {
        query_embedding: queryEmbedding,
        dept_filter: department,
        match_count: topK,
    })
    if (error) {
        console.error('RAG: Supabase RPC error:', error)
        throw error
    }
    return data ?? []
}

// Extract structured data from transcript using Gemini + RAG context
export async function extractWithRAG(
    transcript: string,
    department: string
): Promise<ExtractedMeeting> {
    console.log('RAG: extractWithRAG started for dept:', department)
    const pastContext = await retrieve(transcript.slice(0, 500), department)
    console.log('RAG: Retrieval done, context count:', pastContext.length)

    const contextBlock =
        pastContext.length > 0
            ? pastContext.map((c) => `- [${c.chunk_type}] ${c.content}`).join('\n')
            : 'No past context available yet.'

    const prompt = `You are extracting structured data from a meeting transcript for the ${department} department.

PAST DECISIONS/CONTEXT FROM THIS ORGANISATION:
${contextBlock}

TRANSCRIPT:
${transcript}

Extract and return ONLY valid JSON with this exact structure:
{
  "decisions": [{"text": "", "owner": "", "timestamp": 0}],
  "action_items": [{"text": "", "assignee": "", "due_date": "", "timestamp": 0}],
  "risks": [{"text": "", "severity": "low|medium|high"}],
  "contradictions": [{"new_decision": "", "conflicts_with": "", "reason": ""}]
}

For contradictions: compare new decisions against the PAST CONTEXT above and flag any conflicts.
Return empty arrays if nothing found. Return JSON only, no markdown fences, no explanation.`

    const response = await geminiFlash.generateContent(prompt)
    const raw = response.response.text().trim().replace(/^```json|```$/g, '').trim()
    return JSON.parse(raw) as ExtractedMeeting
}

// Store a processed meeting's chunks back into pgvector for future RAG
export async function ingestMeeting(
    meetingId: string,
    department: string,
    extracted: ExtractedMeeting
): Promise<void> {
    const rows: MeetingChunk[] = []

    for (const d of extracted.decisions) {
        rows.push({
            meeting_id: meetingId,
            department,
            content: d.text,
            chunk_type: 'decision',
            speaker: d.owner,
            timestamp: d.timestamp,
            embedding: await embedText(d.text),
            metadata: {},
        })
    }

    for (const a of extracted.action_items) {
        rows.push({
            meeting_id: meetingId,
            department,
            content: a.text,
            chunk_type: 'action_item',
            speaker: a.assignee,
            timestamp: a.timestamp,
            embedding: await embedText(a.text),
            metadata: { due_date: a.due_date },
        })
    }

    if (rows.length === 0) return
    const { error } = await supabaseAdmin.from('meeting_chunks').insert(rows)
    if (error) throw error
}

// Dedicated contradiction check pass (optional second pass for higher accuracy)
export async function checkContradictions(
    decisions: ExtractedMeeting['decisions'],
    department: string
): Promise<ExtractedMeeting['contradictions']> {
    const contradictions: ExtractedMeeting['contradictions'] = []

    for (const decision of decisions) {
        const similar = await retrieve(decision.text, department, 5)
        if (similar.length === 0) continue

        const context = similar.map((c) => `- ${c.content}`).join('\n')
        const prompt = `Does this new decision contradict any past decisions?

NEW: ${decision.text}

PAST DECISIONS:
${context}

Reply with JSON only, no markdown: {"contradicts": true/false, "reason": "...", "conflicts_with": "..."}`

        const resp = await geminiFlash.generateContent(prompt)
        const raw = resp.response.text().trim().replace(/^```json|```$/g, '').trim()
        const result = JSON.parse(raw)

        if (result.contradicts) {
            contradictions.push({
                new_decision: decision.text,
                conflicts_with: result.conflicts_with,
                reason: result.reason,
            })
        }
    }

    return contradictions
}
