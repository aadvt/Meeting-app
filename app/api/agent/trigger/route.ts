import { NextRequest, NextResponse, after } from 'next/server'
import { createRun, executeRun, type PipelineInput } from '@/lib/agent/runs'

export const runtime = 'nodejs'

/**
 * POST /api/agent/trigger — replaces the n8n "meridian-trigger" webhook.
 *
 * Body (one of meeting_url / bot_id / transcript is required):
 *   { meeting_url, bot_name?, department?, title? }   deploy a bot, wait for the recording, process it
 *   { bot_id, meeting_id?, department? }              bot already deployed — wait for it, then process
 *   { transcript, department?, title? }               skip recording, process the transcript directly
 *   wait?: boolean                                    respond only after the pipeline finishes
 *
 * If MERIDIAN_WEBHOOK_SECRET is set, the request needs a matching x-webhook-secret header.
 */
export async function POST(req: NextRequest) {
    const secret = process.env.MERIDIAN_WEBHOOK_SECRET
    if (secret && req.headers.get('x-webhook-secret') !== secret) {
        return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const { wait, ...input } = (await req.json()) as PipelineInput & { wait?: boolean }
    if (!input.meeting_url && !input.bot_id && !input.transcript) {
        return NextResponse.json({ error: 'one of meeting_url, bot_id, or transcript is required' }, { status: 400 })
    }

    const run = createRun(input)

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
