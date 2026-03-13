import { NextRequest, NextResponse } from 'next/server'
import { getRecallApiBaseUrl } from '@/lib/recall-base-url'

export async function POST(req: NextRequest) {
  try {
    const recallBaseUrl = getRecallApiBaseUrl()
    const { bot_id } = await req.json()
    if (!bot_id) return NextResponse.json({ error: 'bot_id required' }, { status: 400 })

    const recallRes = await fetch(`${recallBaseUrl}/bot/${bot_id}/leave_call/`, {
      method: 'POST',
      headers: { Authorization: `Token ${process.env.RECALL_API_KEY}` },
    })

    if (!recallRes.ok) throw new Error(`Failed to stop bot: ${recallRes.status}`)

    return NextResponse.json({ success: true, bot_id, status: 'stopping' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
