import { NextRequest, NextResponse } from 'next/server'
import { extractWithRAG } from '@/lib/rag'

export async function POST(req: NextRequest) {
    try {
        const { transcript, department } = await req.json()

        if (!transcript || !department) {
            return NextResponse.json({ error: 'transcript and department are required' }, { status: 400 })
        }

        const extracted = await extractWithRAG(transcript, department)
        return NextResponse.json({ extracted })
    } catch (err: any) {
        console.error('[RAG extract error]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
