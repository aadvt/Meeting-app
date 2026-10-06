import { NextRequest, NextResponse } from 'next/server'
import { getRun } from '@/lib/agent/runs'

export const runtime = 'nodejs'

/** GET /api/agent/runs/:id — progress and outputs of a pipeline run. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const run = getRun(id)
    if (!run) return NextResponse.json({ error: 'run not found' }, { status: 404 })
    return NextResponse.json(run)
}
