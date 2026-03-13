/**
 * Deepgram transcription helper
 * Uses Deepgram REST API directly via fetch to avoid SDK conflicts.
 * Model: nova-2, with speaker diarization and utterances
 */

export interface Utterance {
    speaker: number
    start: number
    end: number
    transcript: string
}

export interface TranscriptionResult {
    formatted: string
    utterances: Utterance[]
    speakers: number[]
}

/**
 * Transcribe a remote audio/video URL using the Deepgram REST API.
 */
export async function transcribeUrl(url: string): Promise<TranscriptionResult> {
    const apiKey = process.env.DEEPGRAM_API_KEY
    if (!apiKey) throw new Error('DEEPGRAM_API_KEY is not set')

    // Using post-ingestion processing logic
    const params = new URLSearchParams({
        model: 'nova-2',
        smart_format: 'true',
        diarize: 'true',
        utterances: 'true',
        punctuate: 'true',
        language: 'en',
    })

    const res = await fetch(
        `https://api.deepgram.com/v1/listen?${params}`,
        {
            method: 'POST',
            headers: {
                Authorization: `Token ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url }),
        }
    )

    if (!res.ok) {
        const err = await res.text()
        throw new Error(`Deepgram API error (${res.status}): ${err}`)
    }

    const data = await res.json()
    const results = data?.results
    const utterancesRaw: any[] = results?.utterances ?? []

    const utterances: Utterance[] = utterancesRaw.map((u: any) => ({
        speaker: u.speaker ?? 0,
        start: u.start ?? 0,
        end: u.end ?? 0,
        transcript: u.transcript ?? '',
    }))

    // Fallback if diarization is missing
    if (utterances.length === 0) {
        const fullText = results?.channels?.[0]?.alternatives?.[0]?.transcript ?? '[no transcript]'
        return {
            formatted: `Speaker 0: ${fullText}`,
            utterances: [{ speaker: 0, start: 0, end: 0, transcript: fullText }],
            speakers: [0],
        }
    }

    const formatted = utterances
        .map((u) => `Speaker ${u.speaker}: ${u.transcript}`)
        .join('\n')

    const speakers = [...new Set(utterances.map((u) => u.speaker))].sort()

    return { formatted, utterances, speakers }
}
