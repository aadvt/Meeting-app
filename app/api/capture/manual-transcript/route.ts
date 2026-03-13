import { NextRequest, NextResponse } from 'next/server'
import { extractWithRAG } from '@/lib/rag'
import { ingestMeeting } from '@/lib/rag'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { transcript, department, meeting_title } = await req.json()

    if (!transcript || !department) {
      return NextResponse.json({ error: 'transcript and department are required' }, { status: 400 })
    }

    const meetingPayload = {
      title: meeting_title ?? 'Manual Transcript',
      department,
      transcript,
      status: 'done',
      started_at: new Date().toISOString(),
      ended_at: new Date().toISOString(),
    }

    let { data: meeting, error } = await supabaseAdmin
      .from('meetings')
      .insert(meetingPayload)
      .select()
      .single()

    if (error && error.message?.includes("'status' column")) {
      ;({ data: meeting, error } = await supabaseAdmin
        .from('meetings')
        .insert({
          title: meetingPayload.title,
          department: meetingPayload.department,
          transcript: meetingPayload.transcript,
          started_at: meetingPayload.started_at,
          ended_at: meetingPayload.ended_at,
        })
        .select()
        .single())
    }

    if (error) throw error

    const extracted = await extractWithRAG(transcript, department)

    await ingestMeeting(meeting.id, department, extracted)

    return NextResponse.json({
      success: true,
      meeting_id: meeting.id,
      department,
      extracted,
      summary: {
        decisions: extracted.decisions?.length ?? 0,
        actions: extracted.action_items?.length ?? 0,
        risks: extracted.risks?.length ?? 0,
        contradictions: extracted.contradictions?.length ?? 0,
      },
    })
  } catch (err: any) {
    console.error('[manual-transcript error]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
