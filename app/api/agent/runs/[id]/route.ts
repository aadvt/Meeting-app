import { NextRequest, NextResponse, after } from 'next/server'
import { getRun, isRecordingFinished, resumeRun } from '@/lib/agent/runs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

/**
 * GET /api/agent/runs/:id — progress and outputs of a pipeline run.
 * Also advances a run waiting for its recording once the bot has finished, so the
 * pipeline completes even without the Recall webhook as long as someone is watching.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const run = await getRun(id)
    if (!run) return NextResponse.json({ error: 'run not found' }, { status: 404 })

    const finished = await isRecordingFinished(run).catch(() => false)
    if (finished) {
        after(() => resumeRun(run.id))
        return NextResponse.json({ ...run, status: 'running', currentStep: 'poll_bot' })
    }

    return NextResponse.json(run)
}
