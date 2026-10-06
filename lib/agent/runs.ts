import { randomUUID } from 'crypto'
import type { Department } from '@/lib/department-profiles'
import { getMeetingGraph } from './graph'
import { setMeetingStatus } from './db'
import { isSlackConfigured, postToSlack } from './integrations/slack'
import type { OutputLog, PipelineUpdate } from './state'

export interface PipelineInput {
    department?: string
    title?: string
    meeting_url?: string
    bot_name?: string
    bot_id?: string
    meeting_id?: string
    transcript?: string
}

export interface AgentRun {
    id: string
    status: 'running' | 'completed' | 'failed'
    currentStep?: string
    steps: string[]
    meetingId?: string
    botId?: string
    botStatus?: string
    outputs: OutputLog[]
    errors: string[]
    error?: string
    startedAt: string
    finishedAt?: string
}

const MAX_RUNS = 200
// Kept on globalThis so runs survive Next.js dev hot reloads. In-memory only:
// restart the server and run history is gone (meeting data itself lives in Supabase).
const runs: Map<string, AgentRun> = ((globalThis as any).__meridianAgentRuns ??= new Map())

export function normalizeDepartment(value?: string): Department {
    const dept = (value ?? 'eng').trim().toLowerCase().slice(0, 3)
    return (['eng', 'fin', 'mkt'] as const).includes(dept as Department) ? (dept as Department) : 'eng'
}

export function getRun(id: string): AgentRun | undefined {
    return runs.get(id)
}

export function listRuns(): AgentRun[] {
    return [...runs.values()].reverse()
}

export function createRun(input: PipelineInput): AgentRun {
    const run: AgentRun = {
        id: randomUUID(),
        status: 'running',
        steps: [],
        meetingId: input.meeting_id,
        botId: input.bot_id,
        outputs: [],
        errors: [],
        startedAt: new Date().toISOString(),
    }
    runs.set(run.id, run)
    while (runs.size > MAX_RUNS) runs.delete(runs.keys().next().value!)
    return run
}

/** Execute the LangGraph pipeline for a run created with createRun(). Never throws. */
export async function executeRun(run: AgentRun, input: PipelineInput): Promise<AgentRun> {
    const graph = getMeetingGraph()

    try {
        const stream = await graph.stream(
            {
                department: normalizeDepartment(input.department),
                title: input.title,
                meetingUrl: input.meeting_url,
                botName: input.bot_name,
                botId: input.bot_id,
                meetingId: input.meeting_id,
                transcript: input.transcript,
            },
            // Each bot poll is one superstep, so allow long meetings
            { streamMode: 'updates', recursionLimit: 1000 }
        )

        for await (const chunk of stream) {
            for (const [node, update] of Object.entries(chunk as Record<string, PipelineUpdate | undefined>)) {
                run.currentStep = node
                run.steps.push(node)
                if (!update) continue
                if (update.meetingId) run.meetingId = update.meetingId
                if (update.botId) run.botId = update.botId
                if (update.botStatus) run.botStatus = update.botStatus
                if (update.outputs) run.outputs.push(...(update.outputs as OutputLog[]))
                if (update.errors) run.errors.push(...(update.errors as string[]))
            }
        }

        run.status = run.steps.includes('alert_failure') ? 'failed' : 'completed'
    } catch (err) {
        run.status = 'failed'
        run.error = err instanceof Error ? err.message : String(err)
        console.error(`[agent] Run ${run.id} failed after ${run.currentStep ?? 'start'}:`, err)

        if (run.meetingId) await setMeetingStatus(run.meetingId, 'error').catch(() => {})
        if (isSlackConfigured()) {
            await postToSlack(
                `🚨 Meridian Error — pipeline failed after ${run.currentStep ?? 'start'} for meeting ${run.meetingId ?? 'n/a'}: ${run.error}`
            ).catch(() => {})
        }
    }

    run.finishedAt = new Date().toISOString()
    return run
}
