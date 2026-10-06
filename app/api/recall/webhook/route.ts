import { NextRequest, NextResponse, after } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { findActiveRunByBot, resumeRun } from '@/lib/agent/runs'

export const maxDuration = 300

/**
 * POST /api/recall/webhook
 * 
 * Receives real-time events from Recall.ai.
 * When recording is done — resumes the agent run for that bot, or (for bots deployed
 * via /api/recall/deploy) auto-triggers the legacy processing pipeline.
 * 
 * Set this as your Recall webhook URL in the dashboard:
 *   https://your-domain/api/recall/webhook
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { event, data } = body

        // Legacy: { event: 'bot.status_change', data: { bot_id, status: { code } } }
        // Current: { event: 'bot.done', data: { bot: { id }, data: { code } } }
        const botId = (data?.bot?.id ?? data?.bot_id) as string | undefined
        const code = event === 'bot.status_change' ? data?.status?.code : String(event ?? '').replace(/^bot\./, '')

        console.log(`[webhook] Recall event: ${event} (${code}) bot=${botId}`)

        if (!botId) {
            return NextResponse.json({ received: true, processed: false })
        }

        // Bots deployed by the agent pipeline: resume (or let the in-process poller handle it)
        const run = await findActiveRunByBot(botId)
        if (run) {
            if (run.status === 'waiting_for_recording' && ['done', 'fatal', 'recording_done'].includes(code)) {
                after(() => resumeRun(run.id))
                return NextResponse.json({ received: true, processed: true, run_id: run.id })
            }
            return NextResponse.json({ received: true, processed: false, reason: 'handled by agent pipeline' })
        }

        // Only handle recording_done events
        if (code !== 'recording_done') {
            return NextResponse.json({ received: true, processed: false })
        }

        // Look up which meeting this bot belongs to (we stored it as `recall:{bot_id}`)
        const { data: meeting, error } = await supabaseAdmin
            .from('meetings')
            .select('id, department')
            .eq('audio_url', `recall:${botId}`)
            .single()

        if (error || !meeting) {
            console.error('[webhook] No meeting found for bot_id:', botId)
            return NextResponse.json({ received: true, processed: false, error: 'meeting not found' })
        }

        // Auto-trigger the processing pipeline (fire and forget — don't await)
        const processUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/recall/process`
        fetch(processUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                bot_id: botId,
                meeting_id: meeting.id,
                department: meeting.department,
            }),
        }).catch((err) => console.error('[webhook] Failed to trigger process:', err))

        return NextResponse.json({ received: true, processed: true, meeting_id: meeting.id })
    } catch (err: any) {
        console.error('[recall/webhook error]', err)
        // Always return 200 to Recall so it doesn't retry endlessly
        return NextResponse.json({ received: true, error: err.message })
    }
}
