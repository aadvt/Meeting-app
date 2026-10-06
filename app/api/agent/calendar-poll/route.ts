import { NextRequest, NextResponse } from 'next/server'
import { pollCalendar } from '@/lib/agent/calendar-trigger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/agent/calendar-poll — check Google Calendar for meetings that just started
 * and send a bot to each. Hit it once a minute from any cron (Vercel Cron, GitHub
 * Actions, cron-job.org…), or set AGENT_CALENDAR_POLL=true to poll in-process instead.
 *
 * If CRON_SECRET is set, requires `Authorization: Bearer <CRON_SECRET>` (Vercel Cron sends this).
 */
export async function GET(req: NextRequest) {
    const secret = process.env.CRON_SECRET
    if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
        return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    try {
        const runs = await pollCalendar()
        return NextResponse.json({ started: runs.map((r) => r.id) })
    } catch (err: any) {
        console.error('[agent/calendar-poll error]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
