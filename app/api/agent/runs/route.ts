import { NextResponse } from 'next/server'
import { listRuns } from '@/lib/agent/runs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** GET /api/agent/runs — recent pipeline runs (newest first, this server process only). */
export async function GET() {
    return NextResponse.json({ runs: listRuns() })
}
