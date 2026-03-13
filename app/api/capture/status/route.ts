import { NextRequest, NextResponse } from 'next/server'
import { getRecallApiBaseUrl } from '@/lib/recall-base-url'

export async function GET(req: NextRequest) {
  try {
    const recallBaseUrl = getRecallApiBaseUrl()
    const { searchParams } = new URL(req.url)
    const bot_id = searchParams.get('bot_id')

    if (!bot_id) {
      return NextResponse.json({ error: 'bot_id is required' }, { status: 400 })
    }

    const recallRes = await fetch(`${recallBaseUrl}/bot/${bot_id}/`, {
      headers: {
        Authorization: `Token ${process.env.RECALL_API_KEY}`,
      },
    })

    if (!recallRes.ok) throw new Error(`Recall.ai status error: ${recallRes.status}`)

    const bot = await recallRes.json()

    const statusMap: Record<string, string> = {
      joining_call: 'bot_joining',
      in_waiting_room: 'waiting',
      in_call_not_recording: 'joined',
      in_call_recording: 'recording',
      call_ended: 'processing',
      done: 'done',
      fatal: 'error',
    }

    return NextResponse.json({
      bot_id,
      status: statusMap[bot.status_changes?.at(-1)?.code] ?? bot.status_changes?.at(-1)?.code ?? 'unknown',
      raw_status: bot.status_changes?.at(-1)?.code,
      meeting_url: bot.meeting_url,
      metadata: bot.metadata,
    })
  } catch (err: any) {
    console.error('[capture/status error]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
