import { NextRequest, NextResponse } from 'next/server'
import { extractWithRAG, ingestMeeting, checkContradictions } from '@/lib/rag'

export async function POST(req: NextRequest) {
    try {
        const { meeting_id, department, transcript, extracted: preExtracted } = await req.json()

        if (!meeting_id || !department || !transcript) {
            return NextResponse.json({ error: 'meeting_id, department, and transcript are required' }, { status: 400 })
        }

        let extracted: any

        if (preExtracted) {
            // Pre-extracted data provided — skip ALL Gemini calls entirely
            extracted = preExtracted
        } else {
            // No extracted data — run full Gemini pipeline
            if (!transcript) {
                return NextResponse.json({ error: 'transcript is required when extracted is not provided' }, { status: 400 })
            }
            extracted = await extractWithRAG(transcript, department)
            const contradictions = await checkContradictions(extracted.decisions, department)
            extracted.contradictions = [...(extracted.contradictions ?? []), ...contradictions]
        }

        // Store back into pgvector for future meetings
        await ingestMeeting(meeting_id, department, extracted)

        return NextResponse.json({ success: true, extracted })
    } catch (err: any) {
        console.error('[RAG ingest error]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
