import { NextRequest, NextResponse } from 'next/server'
import { getRecallApiBaseUrl } from '@/lib/recall-base-url'

export async function POST(req: NextRequest) {
  try {
    const recallBaseUrl = getRecallApiBaseUrl()
    const { meeting_url, department, meeting_id, meeting_title } = await req.json()

    if (!meeting_url || !department || !meeting_id) {
      return NextResponse.json(
        {
          error: 'meeting_url, department, and meeting_id are required',
        },
        { status: 400 }
      )
    }

    const validDepts = ['eng', 'fin', 'mkt']
    if (!validDepts.includes(department)) {
      return NextResponse.json(
        {
          error: `department must be one of: ${validDepts.join(', ')}`,
        },
        { status: 400 }
      )
    }

    const recallRes = await fetch(`${recallBaseUrl}/bot/`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${process.env.RECALL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        meeting_url,
        bot_name: 'Meridian',
        transcription_options: {
          provider: 'deepgram',
          deepgram_api_key: process.env.DEEPGRAM_API_KEY,
          language: 'en',
          diarize: true,
          punctuate: true,
          utterances: true,
        },
        real_time_transcription: {
          destination_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/capture/transcript-webhook`,
          partial_results: false,
        },
        recording_config: {
          transcript: true,
        },
        metadata: {
          meeting_id,
          department,
          meeting_title: meeting_title ?? 'Untitled Meeting',
        },
      }),
    })

    if (!recallRes.ok) {
      const err = await recallRes.text()
      throw new Error(`Recall.ai error: ${recallRes.status} — ${err}`)
    }

    const bot = await recallRes.json()

    const { supabaseAdmin } = await import('@/lib/supabase')
    let { error: meetingUpdateError } = await supabaseAdmin
      .from('meetings')
      .update({
        recall_bot_id: bot.id,
        status: 'recording',
      })
      .eq('id', meeting_id)

    if (meetingUpdateError?.message?.includes("'status' column")) {
      const fallback = await supabaseAdmin
        .from('meetings')
        .update({
          recall_bot_id: bot.id,
        })
        .eq('id', meeting_id)

      meetingUpdateError = fallback.error
    }

    if (meetingUpdateError) {
      throw new Error(`Failed to update meeting: ${meetingUpdateError.message}`)
    }

    return NextResponse.json({
      success: true,
      bot_id: bot.id,
      meeting_id,
      status: 'bot_joining',
      message: 'Meridian bot is joining the meeting',
    })
  } catch (err: any) {
    console.error('[capture/start error]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
