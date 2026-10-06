import { NextRequest, NextResponse } from 'next/server'
import { listRuns } from '@/lib/agent/runs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** GET /api/agent/runs?limit=20 — recent pipeline runs, newest first. */
export async function GET(req: NextRequest) {
    const limit = Math.min(Number(req.nextUrl.searchParams.get('limit') ?? 20) || 20, 100)
    return NextResponse.json({ runs: await listRuns(limit) })
}
