import type { Department } from '@/lib/department-profiles'
import { getBotStatus } from '@/lib/recall'
import { supabaseAdmin } from '@/lib/supabase'
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

export type RunStatus = 'running' | 'waiting_for_recording' | 'completed' | 'failed'

export interface AgentRun {
    id: string
    status: RunStatus
    currentStep?: string
    steps: string[]
    /** The trigger input, minus the transcript (which can be large) */
    input: Omit<PipelineInput, 'transcript'> & { has_transcript?: boolean }
    meetingId?: string
    botId?: string
    botStatus?: string
    outputs: OutputLog[]
    errors: string[]
    error?: string
    startedAt: string
    updatedAt?: string
    finishedAt?: string
}

// A serverless function can be killed mid-run; a run that hasn't moved in this long is dead.
const STALE_RUN_MS = 15 * 60 * 1000

export function normalizeDepartment(value?: string): Department {
    const dept = (value ?? 'eng').trim().toLowerCase().slice(0, 3)
    return (['eng', 'fin', 'mkt'] as const).includes(dept as Department) ? (dept as Department) : 'eng'
}

// ── Persistence (public.agent_runs) ───────────────────────────────────────────

function fromRow(row: any): AgentRun {
    const run: AgentRun = {
        id: row.id,
        status: row.status,
        currentStep: row.current_step ?? undefined,
        steps: row.steps ?? [],
        input: row.input ?? {},
        meetingId: row.meeting_id ?? undefined,
        botId: row.bot_id ?? undefined,
        botStatus: row.bot_status ?? undefined,
        outputs: row.outputs ?? [],
        errors: row.errors ?? [],
        error: row.error ?? undefined,
        startedAt: row.started_at,
        updatedAt: row.updated_at,
        finishedAt: row.finished_at ?? undefined,
    }
    if (run.status === 'running' && Date.now() - new Date(row.updated_at).getTime() > STALE_RUN_MS) {
        run.status = 'failed'
        run.error ??= `Run stopped responding during ${run.currentStep ?? 'start'}`
    }
    return run
}

function toRow(run: AgentRun) {
    return {
        status: run.status,
        current_step: run.currentStep ?? null,
        steps: run.steps,
        meeting_id: run.meetingId ?? null,
        bot_id: run.botId ?? null,
        bot_status: run.botStatus ?? null,
        outputs: run.outputs,
        errors: run.errors,
        error: run.error ?? null,
        finished_at: run.finishedAt ?? null,
        updated_at: new Date().toISOString(),
    }
}

async function saveRun(run: AgentRun): Promise<void> {
    const { error } = await supabaseAdmin.from('agent_runs').update(toRow(run)).eq('id', run.id)
    if (error) console.error(`[agent] Failed to save run ${run.id}:`, error.message)
}

export async function createRun(input: PipelineInput): Promise<AgentRun> {
    const { transcript, ...rest } = input
    const { data, error } = await supabaseAdmin
        .from('agent_runs')
        .insert({
            status: 'running',
            input: { ...rest, has_transcript: Boolean(transcript) },
            meeting_id: input.meeting_id ?? null,
            bot_id: input.bot_id ?? null,
        })
        .select()
        .single()
    if (error) throw new Error(`Failed to create run: ${error.message}`)
    return fromRow(data)
}

export async function getRun(id: string): Promise<AgentRun | null> {
    const { data, error } = await supabaseAdmin.from('agent_runs').select().eq('id', id).maybeSingle()
    if (error) throw new Error(`Failed to load run: ${error.message}`)
    return data ? fromRow(data) : null
}

export async function listRuns(limit = 20): Promise<AgentRun[]> {
    const { data, error } = await supabaseAdmin
        .from('agent_runs')
        .select()
        .order('started_at', { ascending: false })
        .limit(limit)
    if (error) throw new Error(`Failed to list runs: ${error.message}`)
    return (data ?? []).map(fromRow)
}

/** A run that is still working on (or waiting for) this Recall bot. */
export async function findActiveRunByBot(botId: string): Promise<AgentRun | null> {
    const { data } = await supabaseAdmin
        .from('agent_runs')
        .select()
        .eq('bot_id', botId)
        .in('status', ['running', 'waiting_for_recording'])
        .order('started_at', { ascending: false })
        .limit(1)
    return data?.[0] ? fromRow(data[0]) : null
}

// ── Execution ─────────────────────────────────────────────────────────────────

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
            await saveRun(run)
        }

        if (run.steps.includes('alert_failure')) {
            run.status = 'failed'
            run.error = run.errors.at(-1)
        } else if (run.currentStep === 'deploy_bot' || run.currentStep === 'poll_bot') {
            // Graph ended early in deferred mode: resumed by the Recall webhook or a status check
            run.status = 'waiting_for_recording'
        } else {
            run.status = 'completed'
        }
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

    if (run.status !== 'waiting_for_recording') run.finishedAt = new Date().toISOString()
    await saveRun(run)
    return run
}

/** Has the bot of a waiting run finished recording (or failed)? */
export async function isRecordingFinished(run: AgentRun): Promise<boolean> {
    if (run.status !== 'waiting_for_recording' || !run.botId) return false
    const codes = ((await getBotStatus(run.botId)).status_changes ?? []).map((s) => s.code)
    return codes.includes('done') || codes.at(-1) === 'fatal'
}

/**
 * Continue a run that is waiting for its recording. Atomically claims the run first,
 * so a webhook and a status check racing each other only process the meeting once.
 */
export async function resumeRun(runId: string): Promise<AgentRun | null> {
    const { data } = await supabaseAdmin
        .from('agent_runs')
        .update({ status: 'running', updated_at: new Date().toISOString() })
        .eq('id', runId)
        .eq('status', 'waiting_for_recording')
        .select()
    if (!data?.[0]) return null

    const run = fromRow(data[0])
    return executeRun(run, {
        bot_id: run.botId,
        meeting_id: run.meetingId,
        department: run.input.department,
        title: run.input.title,
    })
}
