import { NextRequest, NextResponse } from 'next/server'
import { ingestMeeting } from '@/lib/rag'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { meeting_id, department, extracted, transcript, meeting_title } = await req.json()

    if (!meeting_id || !department || !extracted) {
      return NextResponse.json(
        { error: 'meeting_id, department, and extracted are required' },
        { status: 400 }
      )
    }

    await ingestMeeting(meeting_id, department, extracted)

    let { error: upsertError } = await supabaseAdmin
      .from('meetings')
      .upsert(
        {
          id: meeting_id,
          title: meeting_title ?? 'Live Meeting',
          department,
          transcript: transcript ?? null,
          status: 'done',
          ended_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )

    if (upsertError?.message?.includes("'status' column")) {
      const fallback = await supabaseAdmin
        .from('meetings')
        .upsert(
          {
            id: meeting_id,
            title: meeting_title ?? 'Live Meeting',
            department,
            transcript: transcript ?? null,
            ended_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )
      upsertError = fallback.error
    }

    if (upsertError) {
      throw new Error(`Failed to upsert meeting: ${upsertError.message}`)
    }

    return NextResponse.json({
      success: true,
      meeting_id,
      summary: {
        decisions: extracted.decisions?.length ?? 0,
        actions: extracted.action_items?.length ?? 0,
        risks: extracted.risks?.length ?? 0,
        contradictions: extracted.contradictions?.length ?? 0,
      },
    })
  } catch (err: any) {
    console.error('[webhook/meeting error]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
