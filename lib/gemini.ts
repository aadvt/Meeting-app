import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export const geminiFlash = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

export async function embedText(text: string, isQuery = false): Promise<number[]> {
    if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is missing')

    const embeddingModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' })
    const result = await embeddingModel.embedContent({
        content: { parts: [{ text }], role: 'user' },
        taskType: isQuery ? 'RETRIEVAL_QUERY' : 'RETRIEVAL_DOCUMENT',
        outputDimensionality: 768,
    } as any)
    return result.embedding.values
}

export interface SpeakerResult {
    speaker: string
    summary: string
    decisions: string[]
    action_items: string[]
}

export interface ExtractionResult {
    users: SpeakerResult[]
}

const SYSTEM_PROMPT = `You are an expert meeting analyst. 
Given a transcript with speakers labeled as "Speaker 0", "Speaker 1", etc., extract structured information.

Return ONLY a JSON object (no markdown, no explanation) with this exact shape:
{
  "users": [
    {
      "speaker": "Speaker 0",
      "summary": "One sentence describing this speaker's main contributions",
      "decisions": ["List of decisions this speaker was involved in or made"],
      "action_items": ["List of tasks assigned to or committed by this speaker"]
    }
  ]
}

Rules:
- Include ALL speakers present in the transcript
- If a speaker has no decisions or action items, use empty arrays
- Be concise but comprehensive
- Decisions are things agreed upon. Action items are tasks with an owner`

/**
 * Extract structured meeting data from a formatted transcript string using Gemini.
 */
export async function extractMeetingData(
    formattedTranscript: string,
    department?: string
): Promise<ExtractionResult> {
    const result = await geminiFlash.generateContent({
        contents: [
            {
                role: 'user', parts: [
                    { text: SYSTEM_PROMPT },
                    { text: `Department: ${department ?? 'General'}\n\nTRANSCRIPT:\n${formattedTranscript}` }
                ]
            }
        ],
        generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
        }
    })

    const text = result.response.text()
    return JSON.parse(text) as ExtractionResult
}
