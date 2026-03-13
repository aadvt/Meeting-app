import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * POST /api/recall/webhook
 * 
 * Receives real-time events from Recall.ai.
 * When recording is done — auto-triggers the processing pipeline.
 * 
 * Set this as your Recall webhook URL in the dashboard:
 *   https://your-domain/api/recall/webhook
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { event, data } = body

        console.log(`[webhook] Recall event: ${event}`, data)

        // Only handle recording_done events
        if (event !== 'bot.status_change' || data?.status?.code !== 'recording_done') {
            return NextResponse.json({ received: true, processed: false })
        }

        const botId = data?.bot_id as string
        if (!botId) {
            console.warn('[webhook] No bot_id in payload')
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
