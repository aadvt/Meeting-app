import { NextRequest, NextResponse } from 'next/server'
import { getVideoUrl } from '@/lib/recall'
import { transcribeUrl } from '@/lib/deepgram'
import { extractMeetingData } from '@/lib/gemini'
import { supabaseAdmin } from '@/lib/supabase'
import { ingestMeeting } from '@/lib/rag'

/**
 * POST /api/recall/process
 * Body: { bot_id: string, meeting_id: string, department?: string }
 * 
 * Full pipeline:
 *  1. Fetch video URL from Recall
 *  2. Transcribe with Deepgram nova-2 (diarize + utterances)
 *  3. Extract structured data with Gemini Flash
 *  4. Save everything to Supabase (meetings, participants, actions, meeting_chunks)
 */
export async function POST(req: NextRequest) {
    try {
        const { bot_id, meeting_id, department = 'engineering' } = await req.json()

        if (!bot_id || !meeting_id) {
            return NextResponse.json({ error: 'bot_id and meeting_id are required' }, { status: 400 })
        }

        // ── Step 1: Get video URL from Recall ──────────────────────────────
        console.log(`[process] Fetching video URL for bot ${bot_id}`)
        const videoUrl = await getVideoUrl(bot_id)
        if (!videoUrl) {
            return NextResponse.json({ error: 'Recording not ready yet. Check status first.' }, { status: 409 })
        }

        // ── Step 2: Transcribe with Deepgram ───────────────────────────────
        console.log(`[process] Transcribing: ${videoUrl}`)
        const { formatted: transcript, utterances, speakers } = await transcribeUrl(videoUrl)

        // ── Step 3: Extract with OpenAI ────────────────────────────────────
        console.log(`[process] Extracting structured data for ${speakers.length} speakers`)
        const { users } = await extractMeetingData(transcript, department)

        // ── Step 4: Save to Supabase ──────────────────────────────────────

        // 4a. Update meetings row with transcript + audio_url
        await supabaseAdmin
            .from('meetings')
            .update({
                transcript,
                audio_url: videoUrl,
                ended_at: new Date().toISOString(),
            })
            .eq('id', meeting_id)

        // 4b. Insert participants (one per speaker)
        const participantRows = speakers.map((speakerNum) => {
            const userMatch = users.find(
                (u) => u.speaker.toLowerCase().includes(`speaker ${speakerNum}`)
            )
            return {
                meeting_id,
                speaker_label: `Speaker ${speakerNum}`,
                name: userMatch?.speaker ?? `Speaker ${speakerNum}`,
            }
        })
        if (participantRows.length > 0) {
            await supabaseAdmin.from('participants').insert(participantRows)
        }

        // 4c. Insert action items from all speakers into actions table
        const actionRows: any[] = []
        for (const user of users) {
            for (const item of user.action_items ?? []) {
                actionRows.push({
                    meeting_id,
                    description: item,
                    owner: user.speaker,
                    status: 'pending',
                })
            }
        }
        if (actionRows.length > 0) {
            await supabaseAdmin.from('actions').insert(actionRows)
        }

        // 4d. Ingest into meeting_chunks (RAG layer) via existing lib/rag.ts
        const allDecisions = users.flatMap((u) =>
            (u.decisions ?? []).map((text) => ({ text, owner: u.speaker, timestamp: undefined }))
        )
        const allActions = users.flatMap((u) =>
            (u.action_items ?? []).map((text) => ({ text, assignee: u.speaker, due_date: undefined, timestamp: undefined }))
        )

        await ingestMeeting(meeting_id, department, {
            decisions: allDecisions,
            action_items: allActions,
            risks: [],
            contradictions: [],
        })

        return NextResponse.json({
            success: true,
            meeting_id,
            stats: {
                speakers: speakers.length,
                decisions: allDecisions.length,
                action_items: allActions.length,
                transcript_length: transcript.length,
            },
            users,
        })
    } catch (err: any) {
        console.error('[recall/process error]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
