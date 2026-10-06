import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { ChatOpenAI } from '@langchain/openai'

/**
 * Chat model used by every LLM node in the agent pipeline.
 *
 * Defaults to Gemini (same key the rest of the app uses). Set LLM_PROVIDER=openai
 * to use OpenAI instead (the original n8n workflow used gpt-4o).
 */
export function getChatModel(temperature = 0.2): BaseChatModel {
    const provider = process.env.LLM_PROVIDER ?? (process.env.GEMINI_API_KEY ? 'google' : 'openai')

    if (provider === 'openai') {
        if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is missing')
        return new ChatOpenAI({
            model: process.env.OPENAI_MODEL ?? 'gpt-4o',
            apiKey: process.env.OPENAI_API_KEY,
            temperature,
        })
    }

    if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is missing')
    return new ChatGoogleGenerativeAI({
        model: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash',
        apiKey: process.env.GEMINI_API_KEY,
        temperature,
    })
}

/** Flatten a chat model response's content into plain text. */
export function messageText(content: unknown): string {
    if (typeof content === 'string') return content
    if (Array.isArray(content)) {
        return content
            .map((part: any) => (typeof part === 'string' ? part : part?.text ?? ''))
            .join('')
    }
    return ''
}
