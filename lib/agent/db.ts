import { supabaseAdmin } from '@/lib/supabase'

// Some deployments of the meetings table have no `status` column; the rest of the
// app retries without it in that case, so the agent does the same.
const missingStatusColumn = (message?: string) => Boolean(message?.includes("'status' column"))

export async function upsertMeeting(row: Record<string, any> & { id: string }): Promise<void> {
    let { error } = await supabaseAdmin.from('meetings').upsert(row, { onConflict: 'id' })
    if (missingStatusColumn(error?.message)) {
        const { status, ...rest } = row
        ;({ error } = await supabaseAdmin.from('meetings').upsert(rest, { onConflict: 'id' }))
    }
    if (error) throw new Error(`Failed to upsert meeting: ${error.message}`)
}

export async function setMeetingStatus(meetingId: string, status: string, extra: Record<string, any> = {}): Promise<void> {
    let { error } = await supabaseAdmin.from('meetings').update({ status, ...extra }).eq('id', meetingId)
    if (missingStatusColumn(error?.message)) {
        error = Object.keys(extra).length > 0
            ? (await supabaseAdmin.from('meetings').update(extra).eq('id', meetingId)).error
            : null
    }
    if (error) throw new Error(`Failed to update meeting status: ${error.message}`)
}

/**
 * Insert a meeting-level chunk (summary / intelligence delta) into meeting_chunks.
 * Falls back to chunk_type 'discussion' + metadata.kind if the table restricts chunk_type.
 */
export async function insertSummaryChunk(row: {
    meeting_id: string
    department: string
    content: string
    kind: 'summary' | 'summary_delta'
    embedding: number[]
}): Promise<void> {
    const base = {
        meeting_id: row.meeting_id,
        department: row.department,
        content: row.content,
        embedding: row.embedding,
        metadata: { kind: row.kind },
    }
    const { error } = await supabaseAdmin.from('meeting_chunks').insert({ ...base, chunk_type: row.kind })
    if (!error) return

    const fallback = await supabaseAdmin.from('meeting_chunks').insert({ ...base, chunk_type: 'discussion' })
    if (fallback.error) throw new Error(`Failed to insert ${row.kind} chunk: ${fallback.error.message}`)
}

/** Most recent meeting summary for a department, excluding the current meeting. */
export async function fetchLatestSummary(department: string, excludeMeetingId?: string): Promise<string | undefined> {
    let query = supabaseAdmin
        .from('meeting_chunks')
        .select('content')
        .eq('department', department)
        .or('chunk_type.eq.summary,metadata->>kind.eq.summary')
        .order('created_at', { ascending: false })
        .limit(1)
    if (excludeMeetingId) query = query.neq('meeting_id', excludeMeetingId)

    const { data, error } = await query
    if (error) throw new Error(`Failed to fetch past summary: ${error.message}`)
    return data?.[0]?.content
}
