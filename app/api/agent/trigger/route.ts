import { NextRequest, NextResponse, after } from 'next/server'
import { createRun, executeRun, type PipelineInput } from '@/lib/agent/runs'

export const runtime = 'nodejs'
export const maxDuration = 300

/**
 * POST /api/agent/trigger — replaces the n8n "meridian-trigger" webhook.
 *
 * Body (one of meeting_url / bot_id / transcript is required):
 *   { meeting_url, bot_name?, department?, title? }   deploy a bot, wait for the recording, process it
 *   { bot_id, meeting_id?, department? }              bot already deployed — wait for it, then process
 *   { transcript, department?, title? }               skip recording, process the transcript directly
 *   wait?: boolean                                    respond only after the pipeline finishes
 *
 * Access is enforced by proxy.ts (MERIDIAN_ACCESS_CODE / MERIDIAN_WEBHOOK_SECRET).
 */
export async function POST(req: NextRequest) {
    const { wait, ...input } = (await req.json()) as PipelineInput & { wait?: boolean }
    if (!input.meeting_url && !input.bot_id && !input.transcript?.trim()) {
        return NextResponse.json({ error: 'one of meeting_url, bot_id, or transcript is required' }, { status: 400 })
    }

    const run = await createRun(input)

    if (wait) {
        const finished = await executeRun(run, input)
        return NextResponse.json(finished, { status: finished.status === 'failed' ? 500 : 200 })
    }

    after(() => executeRun(run, input))

    return NextResponse.json({
        status: 'received',
        message: input.meeting_url ? 'Meridian bot is being deployed' : 'Meridian pipeline started',
        run_id: run.id,
        status_url: `/api/agent/runs/${run.id}`,
    })
}
