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
