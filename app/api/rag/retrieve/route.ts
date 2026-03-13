import { NextRequest, NextResponse } from 'next/server'
import { retrieve } from '@/lib/rag'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const query = searchParams.get('query')
        const department = searchParams.get('department') ?? 'engineering'
        const topK = parseInt(searchParams.get('topK') ?? '5')

        if (!query) {
            return NextResponse.json({ error: 'query param is required' }, { status: 400 })
        }

        const results = await retrieve(query, department, topK)
        return NextResponse.json({ results })
    } catch (err: any) {
        console.error('[RAG retrieve error]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
