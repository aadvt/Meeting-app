import { NextRequest, NextResponse } from 'next/server'
import { getBotStatus } from '@/lib/recall'

/**
 * GET /api/recall/status?bot_id=xxx
 * Returns the current status of the bot and video_url if recording is done.
 */
export async function GET(req: NextRequest) {
    try {
        const botId = req.nextUrl.searchParams.get('bot_id')
        if (!botId) {
            return NextResponse.json({ error: 'bot_id query param is required' }, { status: 400 })
        }

        const bot = await getBotStatus(botId)

        const latestStatus = bot.status_changes?.[bot.status_changes.length - 1]?.code ?? 'unknown'
        const isDone = bot.status_changes?.some((s) => s.code === 'recording_done') ?? false

        return NextResponse.json({
            bot_id: botId,
            status: latestStatus,
            recording_done: isDone,
            status_changes: bot.status_changes,
        })
    } catch (err: any) {
        console.error('[recall/status error]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
