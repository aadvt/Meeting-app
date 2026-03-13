import { NextRequest, NextResponse } from 'next/server'
import { getRecallApiBaseUrl } from '@/lib/recall-base-url'

export async function POST(req: NextRequest) {
  try {
    const recallBaseUrl = getRecallApiBaseUrl()
    const body = await req.json()
    console.log('[transcript-webhook] received:', JSON.stringify(body).slice(0, 200))

    const eventType = body.event ?? body.type
    if (eventType !== 'transcript.done' && eventType !== 'bot.done') {
      return NextResponse.json({ received: true, skipped: true })
    }

    const botId = body.data?.bot_id ?? body.bot_id
    if (!botId) return NextResponse.json({ error: 'no bot_id' }, { status: 400 })

    const transcriptRes = await fetch(`${recallBaseUrl}/bot/${botId}/transcript/`, {
      headers: { Authorization: `Token ${process.env.RECALL_API_KEY}` },
    })

    if (!transcriptRes.ok) throw new Error(`Failed to fetch transcript: ${transcriptRes.status}`)
    const transcriptData = await transcriptRes.json()

    const botRes = await fetch(`${recallBaseUrl}/bot/${botId}/`, {
      headers: { Authorization: `Token ${process.env.RECALL_API_KEY}` },
    })
    const botData = await botRes.json()
    const { meeting_id, department, meeting_title } = botData.metadata ?? {}

    if (!meeting_id || !department) {
      throw new Error('Bot metadata missing meeting_id or department')
    }

    const plainTranscript = (transcriptData ?? [])
      .map((utterance: any) => {
        const text = utterance.words?.map((w: any) => w.text).join(' ') ?? utterance.text ?? ''
        const speaker = utterance.speaker ?? 'Unknown'
        return `${speaker}: ${text}`
      })
      .join('\n')

    if (!plainTranscript.trim()) {
      throw new Error('Empty transcript received from Recall')
    }

    const { supabaseAdmin } = await import('@/lib/supabase')
    let { error: processingUpdateError } = await supabaseAdmin
      .from('meetings')
      .update({
        transcript: plainTranscript,
        status: 'processing',
      })
      .eq('id', meeting_id)

    if (processingUpdateError?.message?.includes("'status' column")) {
      const fallback = await supabaseAdmin
        .from('meetings')
        .update({
          transcript: plainTranscript,
        })
        .eq('id', meeting_id)
      processingUpdateError = fallback.error
    }

    if (processingUpdateError) {
      throw new Error(`Failed to update meeting transcript: ${processingUpdateError.message}`)
    }

    const extractRes = await fetch(new URL('/api/rag/extract', req.url), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript: plainTranscript, department }),
    })

    const { extracted } = await extractRes.json()
    if (!extractRes.ok || !extracted) throw new Error('Extraction failed')

    const ingestRes = await fetch(new URL('/api/webhook/meeting', req.url), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meeting_id, department, extracted, transcript: plainTranscript, meeting_title }),
    })

    const ingestData = await ingestRes.json()
    if (!ingestRes.ok) throw new Error(`Ingest failed: ${ingestData.error}`)

    let { error: doneUpdateError } = await supabaseAdmin
      .from('meetings')
      .update({
        status: 'done',
        ended_at: new Date().toISOString(),
      })
      .eq('id', meeting_id)

    if (doneUpdateError?.message?.includes("'status' column")) {
      const fallback = await supabaseAdmin
        .from('meetings')
        .update({
          ended_at: new Date().toISOString(),
        })
        .eq('id', meeting_id)
      doneUpdateError = fallback.error
    }

    if (doneUpdateError) {
      throw new Error(`Failed to finalize meeting: ${doneUpdateError.message}`)
    }

    return NextResponse.json({
      success: true,
      meeting_id,
      department,
      summary: ingestData.summary,
    })
  } catch (err: any) {
    console.error('[transcript-webhook error]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
