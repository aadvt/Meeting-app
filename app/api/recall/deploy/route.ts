import { NextRequest, NextResponse } from 'next/server'
import { deployBot } from '@/lib/recall'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * POST /api/recall/deploy
 * Body: { meeting_url: string, bot_name?: string, department?: string, title?: string }
 * Returns: { bot_id, meeting_id }
 */
export async function POST(req: NextRequest) {
    try {
        const { meeting_url, bot_name, department = 'engineering', title } = await req.json()

        if (!meeting_url) {
            return NextResponse.json({ error: 'meeting_url is required' }, { status: 400 })
        }

        // 1. Create a meetings row in Supabase first
        const { data: meeting, error: dbError } = await supabaseAdmin
            .from('meetings')
            .insert({
                title: title ?? `Meeting — ${new Date().toLocaleDateString()}`,
                department: department.slice(0, 3).toLowerCase(), // 'eng', 'fin', 'mkt'
                started_at: new Date().toISOString(),
            })
            .select('id')
            .single()

        if (dbError) throw new Error(`DB insert failed: ${dbError.message}`)

        // 2. Deploy the Recall bot
        const bot_id = await deployBot(meeting_url, bot_name ?? 'Meridian Note-Taker')

        // 3. Save bot_id back to the meeting row (using metadata in audio_url field for now)
        await supabaseAdmin
            .from('meetings')
            .update({ audio_url: `recall:${bot_id}` })
            .eq('id', meeting.id)

        return NextResponse.json({ bot_id, meeting_id: meeting.id })
    } catch (err: any) {
        console.error('[recall/deploy error]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
