import { Annotation } from '@langchain/langgraph'
import { z } from 'zod'
import type { Department } from '@/lib/department-profiles'

/** Structured output of the extraction node (n8n's "Process Meeting" `structured` payload). */
export const ExtractionSchema = z.object({
    title: z.string().describe('Short descriptive meeting title, max 8 words'),
    meeting_summary: z.string().describe('3-6 sentence summary of the whole meeting'),
    users: z
        .array(
            z.object({
                speaker: z.string().describe('Speaker label or name exactly as it appears in the transcript'),
                summary: z.string().describe("One sentence describing this speaker's main contributions"),
                decisions: z.array(z.string()).describe('Decisions this speaker made or was involved in'),
                action_items: z.array(z.string()).describe('Tasks assigned to or committed by this speaker'),
            })
        )
        .describe('One entry per speaker present in the transcript'),
    risks: z.array(
        z.object({
            text: z.string(),
            severity: z.enum(['low', 'medium', 'high']),
        })
    ),
    contradictions: z
        .array(
            z.object({
                new_decision: z.string(),
                conflicts_with: z.string(),
                reason: z.string(),
            })
        )
        .describe('New decisions that conflict with the past organisational context provided'),
})
export type Extraction = z.infer<typeof ExtractionSchema>

export interface OutputLog {
    target: 'supabase' | 'rag' | 'gmail' | 'calendar' | 'jira' | 'github' | 'slack'
    status: 'done' | 'skipped' | 'failed'
    detail: string
    link?: string
}

const append = <T>() =>
    Annotation<T[]>({
        reducer: (current, update) => current.concat(update),
        default: () => [],
    })

export const PipelineState = Annotation.Root({
    // ── Input ─────────────────────────────────────────────
    department: Annotation<Department>,
    title: Annotation<string | undefined>,
    meetingUrl: Annotation<string | undefined>,
    botName: Annotation<string | undefined>,

    // ── Identifiers ───────────────────────────────────────
    meetingId: Annotation<string | undefined>,
    botId: Annotation<string | undefined>,

    // ── Recording ─────────────────────────────────────────
    botStatus: Annotation<string | undefined>,
    pollAttempts: Annotation<number>({ reducer: (_, v) => v, default: () => 0 }),
    videoUrl: Annotation<string | undefined>,

    // ── Analysis ──────────────────────────────────────────
    transcript: Annotation<string | undefined>,
    speakers: Annotation<string[]>({ reducer: (_, v) => v, default: () => [] }),
    pastSummary: Annotation<string | undefined>,
    pastContext: Annotation<string[]>({ reducer: (_, v) => v, default: () => [] }),
    extraction: Annotation<Extraction | undefined>,
    delta: Annotation<string | undefined>,

    // ── Results (appended by parallel branches) ───────────
    outputs: append<OutputLog>(),
    errors: append<string>(),
})

export type PipelineStateType = typeof PipelineState.State
export type PipelineUpdate = typeof PipelineState.Update
