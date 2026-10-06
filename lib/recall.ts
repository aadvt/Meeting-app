/**
 * Recall.ai API helper
 * Docs: https://docs.recall.ai
 */

const RECALL_BASE = `https://${process.env.RECALL_REGION ?? 'us-east-1'}.recall.ai/api/v1`
const RECALL_HEADERS = {
    'Authorization': `Token ${process.env.RECALL_API_KEY}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
}

export interface RecallBotStatus {
    id: string
    status_changes: Array<{ code: string; created_at: string; message?: string }>
    video_url?: string
    meeting_url?: string
    recordings?: Array<{
        status?: { code: string }
        media_shortcuts?: Record<string, { data?: { download_url?: string } } | null>
    }>
}

/**
 * Deploy a headless bot to a live meeting URL.
 * Returns the bot_id.
 */
export async function deployBot(meetingUrl: string, botName = 'Meridian Note-Taker'): Promise<string> {
    const res = await fetch(`${RECALL_BASE}/bot`, {
        method: 'POST',
        headers: RECALL_HEADERS,
        body: JSON.stringify({
            meeting_url: meetingUrl,
            bot_name: botName,
            // No real-time transcription — the recording is transcribed with Deepgram afterwards
        }),
    })
    if (!res.ok) {
        const err = await res.text()
        throw new Error(`Recall deployBot failed (${res.status}): ${err}`)
    }
    const data = await res.json()
    return data.id as string
}

/**
 * Get full bot status from Recall.
 */
export async function getBotStatus(botId: string): Promise<RecallBotStatus> {
    const res = await fetch(`${RECALL_BASE}/bot/${botId}`, {
        headers: RECALL_HEADERS,
    })
    if (!res.ok) {
        const err = await res.text()
        throw new Error(`Recall getBotStatus failed (${res.status}): ${err}`)
    }
    return res.json()
}

/**
 * Extract the video/audio URL from a completed bot.
 * Returns null if recording isn't done yet.
 */
export async function getVideoUrl(botId: string): Promise<string | null> {
    const bot = await getBotStatus(botId)

    const isDone = bot.status_changes?.some((s) => s.code === 'recording_done')
    if (!isDone) return null

    // Recordings are embedded in the bot object; media URLs live under media_shortcuts
    const completed = bot.recordings?.find((r) => r.status?.code === 'done')
    return completed?.media_shortcuts?.audio_mixed?.data?.download_url
        ?? completed?.media_shortcuts?.video_mixed?.data?.download_url
        ?? bot.video_url
        ?? null
}
