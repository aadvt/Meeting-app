import { randomUUID } from 'crypto'
import { z } from 'zod'
import { deployBot, getBotStatus, getVideoUrl } from '@/lib/recall'
import { transcribeUrl } from '@/lib/deepgram'
import { embedText } from '@/lib/gemini'
import { ingestMeeting, retrieve } from '@/lib/rag'
import { supabaseAdmin } from '@/lib/supabase'
import { getProfile } from '@/lib/department-profiles'
import { getChatModel, messageText } from './llm'
import { fetchLatestSummary, insertSummaryChunk, setMeetingStatus, upsertMeeting } from './db'
import { ExtractionSchema, type Extraction, type OutputLog, type PipelineStateType, type PipelineUpdate } from './state'
import { createCalendarEvent, createGmailDraft, isGoogleConfigured } from './integrations/google'
import { createJiraIssue, isJiraConfigured } from './integrations/jira'
import { commitGitHubFile, createGitHubIssue, getGitHubFile, isGitHubConfigured } from './integrations/github'
import { isSlackConfigured, postToSlack } from './integrations/slack'

const POLL_INTERVAL_MS = Number(process.env.AGENT_POLL_INTERVAL_MS ?? 120_000)
const MAX_POLLS = Number(process.env.AGENT_MAX_POLLS ?? 120)
const MAX_FILE_TASKS = Number(process.env.AGENT_MAX_FILE_TASKS ?? 3)

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const errorMessage = (err: unknown) => (err instanceof Error ? err.message : String(err))

function requireState<T>(value: T | undefined, name: string): T {
    if (value === undefined || value === null || value === '') throw new Error(`Pipeline state is missing ${name}`)
    return value
}

function meetingTitle(state: PipelineStateType): string {
    return state.title ?? state.extraction?.title ?? `Meeting ${state.meetingId}`
}

function actionItems(state: PipelineStateType) {
    return (state.extraction?.users ?? []).flatMap((u) =>
        (u.action_items ?? []).map((text) => ({ text, owner: u.speaker }))
    )
}

function decisions(state: PipelineStateType) {
    return (state.extraction?.users ?? []).flatMap((u) =>
        (u.decisions ?? []).map((text) => ({ text, owner: u.speaker }))
    )
}

/** Run one integration call and turn its outcome into an OutputLog instead of throwing. */
async function attempt(
    target: OutputLog['target'],
    detail: string,
    fn: () => Promise<string | void>
): Promise<OutputLog> {
    try {
        const link = await fn()
        return { target, status: 'done', detail, link: link || undefined }
    } catch (err) {
        console.error(`[agent:${target}] ${detail} failed:`, err)
        return { target, status: 'failed', detail: `${detail}: ${errorMessage(err)}` }
    }
}

const skipped = (target: OutputLog['target'], detail: string): OutputLog => ({ target, status: 'skipped', detail })

// ─────────────────────────────────────────────────────────────────────────────
// Entry routing (n8n: Webhook / Google Calendar Trigger)
// ─────────────────────────────────────────────────────────────────────────────

export function routeEntry(state: PipelineStateType): 'deploy_bot' | 'poll_bot' | 'fetch_context' {
    if (state.transcript) return 'fetch_context' // transcript supplied directly — skip recording
    if (state.botId) return 'poll_bot' // bot already deployed (e.g. Recall webhook)
    if (state.meetingUrl) return 'deploy_bot'
    throw new Error('Provide one of: meeting_url, bot_id, or transcript')
}

// ─────────────────────────────────────────────────────────────────────────────
// Recording (n8n: HTTP Deploy Bot → Wait 2 Minutes → Poll Bot Status → IF Done / IF Failed)
// ─────────────────────────────────────────────────────────────────────────────

export async function deployBotNode(state: PipelineStateType): Promise<PipelineUpdate> {
    const meetingUrl = requireState(state.meetingUrl, 'meetingUrl')
    const meetingId = state.meetingId ?? randomUUID()

    await upsertMeeting({
        id: meetingId,
        title: state.title ?? `Meeting — ${new Date().toLocaleDateString()}`,
        department: state.department,
        started_at: new Date().toISOString(),
        status: 'recording',
    })

    const botId = await deployBot(meetingUrl, state.botName ?? 'Meridian Note-Taker')

    // Same convention as /api/recall/deploy so /api/recall/webhook can find the meeting
    await supabaseAdmin.from('meetings').update({ audio_url: `recall:${botId}` }).eq('id', meetingId)

    console.log(`[agent] Bot ${botId} deployed for meeting ${meetingId}`)
    return { meetingId, botId }
}

export async function pollBotNode(state: PipelineStateType): Promise<PipelineUpdate> {
    const botId = requireState(state.botId, 'botId')
    if (state.pollAttempts > 0) await sleep(POLL_INTERVAL_MS)

    const bot = await getBotStatus(botId)
    const codes = (bot.status_changes ?? []).map((s) => s.code)
    const latest = codes.at(-1) ?? 'unknown'

    let botStatus = latest
    if (codes.includes('done')) botStatus = 'done'
    else if (latest === 'fatal') botStatus = 'failed'
    else if (state.pollAttempts + 1 >= MAX_POLLS) botStatus = 'timed_out'

    console.log(`[agent] Bot ${botId} status: ${latest} (poll ${state.pollAttempts + 1})`)
    return { botStatus, pollAttempts: state.pollAttempts + 1 }
}

export function routeAfterPoll(state: PipelineStateType): 'process_recording' | 'alert_failure' | 'poll_bot' {
    if (state.botStatus === 'done') return 'process_recording'
    if (state.botStatus === 'failed' || state.botStatus === 'timed_out') return 'alert_failure'
    return 'poll_bot'
}

export async function alertFailureNode(state: PipelineStateType): Promise<PipelineUpdate> {
    const message = `🚨 Meridian Error — Bot ${state.botStatus} for meeting ${state.meetingId ?? ''} (bot ${state.botId})`
    const outputs: OutputLog[] = [
        isSlackConfigured()
            ? await attempt('slack', 'Error alert', () => postToSlack(message))
            : skipped('slack', 'SLACK_WEBHOOK_URL not set'),
    ]
    if (state.meetingId) {
        outputs.push(await attempt('supabase', 'Mark meeting as error', () => setMeetingStatus(state.meetingId!, 'error')))
    }
    return { outputs, errors: [message] }
}

// ─────────────────────────────────────────────────────────────────────────────
// Transcription (n8n: HTTP Process Meeting — the transcription half)
// ─────────────────────────────────────────────────────────────────────────────

export async function processRecordingNode(state: PipelineStateType): Promise<PipelineUpdate> {
    const botId = requireState(state.botId, 'botId')

    const videoUrl = await getVideoUrl(botId)
    if (!videoUrl) throw new Error(`Bot ${botId} finished but no recording is available`)

    console.log(`[agent] Transcribing recording from ${new URL(videoUrl).host}`)
    const { formatted, utterances, speakers } = await transcribeUrl(videoUrl)
    // Don't feed an empty meeting into extraction and RAG memory
    if (!utterances.some((u) => u.transcript.trim())) throw new Error(`Recording for bot ${botId} contains no speech`)

    return {
        videoUrl,
        transcript: formatted,
        speakers: speakers.map((n) => `Speaker ${n}`),
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Memory (n8n: Supabase Fetch Past RAG Context) + pgvector retrieval from lib/rag
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchContextNode(state: PipelineStateType): Promise<PipelineUpdate> {
    const transcript = requireState(state.transcript, 'transcript')
    const errors: string[] = []

    const [pastSummary, pastContext] = await Promise.all([
        fetchLatestSummary(state.department, state.meetingId).catch((err) => {
            errors.push(`Past summary lookup failed: ${errorMessage(err)}`)
            return undefined
        }),
        retrieve(transcript.slice(0, 2000), state.department, 5)
            .then((rows) => rows.map((r) => `[${r.chunk_type}] ${r.content}`))
            .catch((err) => {
                errors.push(`Vector retrieval failed: ${errorMessage(err)}`)
                return [] as string[]
            }),
    ])

    return { pastSummary, pastContext, errors }
}

// ─────────────────────────────────────────────────────────────────────────────
// Analysis (n8n: HTTP Process Meeting — the extraction half, and OpenAI: Intelligence Delta)
// These two run in parallel.
// ─────────────────────────────────────────────────────────────────────────────

export async function extractNode(state: PipelineStateType): Promise<PipelineUpdate> {
    const transcript = requireState(state.transcript, 'transcript')
    const profile = getProfile(state.department)

    const contextBlock = state.pastContext.length > 0
        ? state.pastContext.map((c) => `- ${c}`).join('\n')
        : 'No past context available yet.'

    const model = getChatModel(0.2).withStructuredOutput<Extraction>(ExtractionSchema, { name: 'meeting_extraction' })
    const extraction = await model.invoke([
        [
            'system',
            `You are an expert meeting analyst extracting structured data from a ${profile.label} team meeting.

DEPARTMENT FOCUS:
${profile.extractionFocus}

PAST DECISIONS/CONTEXT FROM THIS ORGANISATION:
${contextBlock}

Rules:
- Include ALL speakers present in the transcript, using their labels exactly as written
- If a speaker has no decisions or action items, use empty arrays
- Decisions are things agreed upon. Action items are tasks with an owner
- Only report contradictions against the past context above
- Be concise but comprehensive`,
        ],
        ['human', `TRANSCRIPT:\n${transcript}`],
    ])

    return { extraction }
}

export async function intelligenceDeltaNode(state: PipelineStateType): Promise<PipelineUpdate> {
    const transcript = requireState(state.transcript, 'transcript')

    const response = await getChatModel(0.3).invoke([
        [
            'system',
            "You are Meridian Insight. Compare the Previous Meeting Summary with the Current Meeting Transcript. Identify: (1) Progress on old goals, (2) New agenda items, (3) Deviations. Return a concise 'Memory Update' snippet.",
        ],
        ['human', `PREVIOUS: ${state.pastSummary ?? 'No previous context'}\n\nCURRENT: ${transcript}`],
    ])

    return { delta: messageText(response.content).trim() }
}

// ─────────────────────────────────────────────────────────────────────────────
// Persistence (n8n: Supabase Save Meeting Row)
// ─────────────────────────────────────────────────────────────────────────────

export async function saveMeetingNode(state: PipelineStateType): Promise<PipelineUpdate> {
    const extraction = requireState(state.extraction, 'extraction')
    const meetingId = state.meetingId ?? randomUUID()

    await upsertMeeting({
        id: meetingId,
        title: state.title ?? extraction.title,
        department: state.department,
        transcript: state.transcript,
        ended_at: new Date().toISOString(),
        status: 'processing',
        ...(state.videoUrl ? { audio_url: state.videoUrl } : {}),
        ...(state.botId ? {} : { started_at: new Date().toISOString() }),
    })

    const outputs: OutputLog[] = [{ target: 'supabase', status: 'done', detail: 'Saved meeting row' }]

    const participantRows = extraction.users.map((u) => ({
        meeting_id: meetingId,
        speaker_label: u.speaker,
        name: u.speaker,
    }))
    if (participantRows.length > 0) {
        outputs.push(
            await attempt('supabase', `Saved ${participantRows.length} participants`, async () => {
                const { error } = await supabaseAdmin.from('participants').insert(participantRows)
                if (error) throw new Error(error.message)
            })
        )
    }

    return { meetingId, outputs }
}

// ─────────────────────────────────────────────────────────────────────────────
// Fan-out branch 1 (n8n: Code Prep Action Item Rows → IF Has Action Items →
//   Supabase Save Action Items / Google Calendar / Jira / GitHub Issue)
// ─────────────────────────────────────────────────────────────────────────────

export async function actionItemsNode(state: PipelineStateType): Promise<PipelineUpdate> {
    const meetingId = requireState(state.meetingId, 'meetingId')
    const items = actionItems(state)
    if (items.length === 0) return { outputs: [skipped('supabase', 'No action items found')] }

    const targets = getProfile(state.department).outputTargets
    const outputs: OutputLog[] = []

    outputs.push(
        await attempt('supabase', `Saved ${items.length} action items`, async () => {
            const { error } = await supabaseAdmin.from('actions').insert(
                items.map((item) => ({ meeting_id: meetingId, description: item.text, owner: item.owner, status: 'pending' }))
            )
            if (error) throw new Error(error.message)
        })
    )

    const title = meetingTitle(state)
    for (const item of items) {
        const body = `Assigned to ${item.owner} during meeting "${title}" (${meetingId})`

        if (isGoogleConfigured()) {
            const start = new Date(Date.now() + 24 * 60 * 60 * 1000)
            outputs.push(
                await attempt('calendar', `Event: ${item.text}`, () =>
                    createCalendarEvent({
                        summary: `Action Item: ${item.text}`,
                        description: body,
                        start,
                        end: new Date(start.getTime() + 60 * 60 * 1000),
                    })
                )
            )
        }

        if (targets.includes('jira') && isJiraConfigured()) {
            outputs.push(await attempt('jira', `Issue: ${item.text}`, () => createJiraIssue(`Action Item: ${item.text}`, body)))
        }

        if (targets.includes('github') && isGitHubConfigured()) {
            outputs.push(await attempt('github', `Issue: ${item.text}`, () => createGitHubIssue(`Action Item: ${item.text}`, body)))
        }
    }

    if (!isGoogleConfigured()) outputs.push(skipped('calendar', 'Google OAuth not configured'))
    if (targets.includes('jira') && !isJiraConfigured()) outputs.push(skipped('jira', 'Jira not configured'))
    if (targets.includes('github') && !isGitHubConfigured()) outputs.push(skipped('github', 'GitHub not configured'))

    return { outputs }
}

// ─────────────────────────────────────────────────────────────────────────────
// Fan-out branch 2 (n8n: Code Prep RAG Chunks → Embed Chunk → Attach Embedding → Save RAG Chunk)
// ─────────────────────────────────────────────────────────────────────────────

export async function ingestRagNode(state: PipelineStateType): Promise<PipelineUpdate> {
    const meetingId = requireState(state.meetingId, 'meetingId')
    const extraction = requireState(state.extraction, 'extraction')
    const outputs: OutputLog[] = []

    const meetingChunks = [
        { kind: 'summary' as const, content: extraction.meeting_summary },
        { kind: 'summary_delta' as const, content: state.delta ? `ANALYSIS DELTA: ${state.delta}` : '' },
    ].filter((c) => c.content.trim())

    for (const chunk of meetingChunks) {
        outputs.push(
            await attempt('rag', `Embedded ${chunk.kind}`, async () => {
                await insertSummaryChunk({
                    meeting_id: meetingId,
                    department: state.department,
                    content: chunk.content,
                    kind: chunk.kind,
                    embedding: await embedText(chunk.content),
                })
            })
        )
    }

    const allDecisions = decisions(state)
    const allActions = actionItems(state)
    outputs.push(
        await attempt('rag', `Embedded ${allDecisions.length} decisions and ${allActions.length} action items`, () =>
            ingestMeeting(meetingId, state.department, {
                decisions: allDecisions,
                action_items: allActions.map((a) => ({ text: a.text, assignee: a.owner })),
                risks: extraction.risks,
                contradictions: extraction.contradictions,
            })
        )
    )

    return { outputs }
}

// ─────────────────────────────────────────────────────────────────────────────
// Fan-out branch 3 (n8n: Gmail Create Draft) + Slack summary for every department profile
// ─────────────────────────────────────────────────────────────────────────────

function buildSummaryEmail(state: PipelineStateType): string {
    const extraction = state.extraction!
    const bullet = (lines: string[]) => (lines.length > 0 ? lines.map((l) => `• ${l}`).join('\n') : '• None')

    return [
        'Here is the summary (including RAG Delta Analysis):',
        '',
        state.delta ?? 'No delta analysis available.',
        '',
        'Full Summary:',
        extraction.meeting_summary,
        '',
        'Decisions:',
        bullet(decisions(state).map((d) => `${d.owner}: ${d.text}`)),
        '',
        'Action Items:',
        bullet(actionItems(state).map((a) => `${a.owner}: ${a.text}`)),
        '',
        'Risks:',
        bullet(extraction.risks.map((r) => `[${r.severity}] ${r.text}`)),
        ...(extraction.contradictions.length > 0
            ? ['', 'Contradictions with past decisions:', bullet(extraction.contradictions.map((c) => `${c.new_decision} ↔ ${c.conflicts_with} — ${c.reason}`))]
            : []),
    ].join('\n')
}

export async function notifyNode(state: PipelineStateType): Promise<PipelineUpdate> {
    const title = meetingTitle(state)
    const body = buildSummaryEmail(state)
    const targets = getProfile(state.department).outputTargets

    const outputs: OutputLog[] = [
        isGoogleConfigured()
            ? await attempt('gmail', 'Created summary draft', () => createGmailDraft(`[Meridian] Meeting Summary: ${title}`, body))
            : skipped('gmail', 'Google OAuth not configured'),
    ]

    if (targets.includes('slack')) {
        outputs.push(
            isSlackConfigured()
                ? await attempt('slack', 'Posted summary', () => postToSlack(`*[Meridian] ${title}*\n\n${body}`))
                : skipped('slack', 'SLACK_WEBHOOK_URL not set')
        )
    }

    return { outputs }
}

// ─────────────────────────────────────────────────────────────────────────────
// Fan-out branch 4 (n8n: OpenAI Identify File Tasks → Split In Batches →
//   OpenAI Write File Code → GitHub Commit File Change → Log GitHub Success)
// Routed by department (n8n: Switch Route by Department) — only profiles with a
// 'github' output target get code commits.
// ─────────────────────────────────────────────────────────────────────────────

const FileTasksSchema = z.object({
    tasks: z.array(
        z.object({
            action: z.enum(['CREATE', 'UPDATE']),
            filename: z.string().describe('Repository-relative path, e.g. src/app/api/payments/route.ts'),
            goal: z.string().describe('Detailed technical goal for the file'),
        })
    ),
})

function stripCodeFences(text: string): string {
    const match = text.trim().match(/^```[\w.+-]*\n([\s\S]*?)\n?```$/)
    return match ? match[1] : text.trim()
}

export async function codeTasksNode(state: PipelineStateType): Promise<PipelineUpdate> {
    if (!getProfile(state.department).outputTargets.includes('github')) {
        return { outputs: [skipped('github', `No code tasks for department '${state.department}'`)] }
    }
    if (process.env.AGENT_ENABLE_CODE_COMMITS !== 'true') {
        return { outputs: [skipped('github', 'Code commits disabled (set AGENT_ENABLE_CODE_COMMITS=true)')] }
    }
    if (!isGitHubConfigured()) return { outputs: [skipped('github', 'GitHub not configured')] }

    const transcript = requireState(state.transcript, 'transcript')
    const outputs: OutputLog[] = []

    let tasks: z.infer<typeof FileTasksSchema>['tasks']
    try {
        const identified = await getChatModel(0.1)
            .withStructuredOutput<z.infer<typeof FileTasksSchema>>(FileTasksSchema, { name: 'file_tasks' })
            .invoke([
                [
                    'system',
                    `You are a DevOps Architect. Analyze the FULL MEETING TRANSCRIPT to identify any explicit requests to CREATE or UPDATE files on GitHub.

Rules:
1. If a specific filename is mentioned (e.g. 'README.md'), use it.
2. If a file is described (e.g. 'the api route for payments'), infer the likely path (e.g. 'src/app/api/payments/route.ts').
3. Action must be 'CREATE' or 'UPDATE'.
4. Return an empty list if nobody asked for a file to be created or changed.`,
                ],
                ['human', transcript],
            ])
        tasks = identified.tasks.slice(0, MAX_FILE_TASKS)
    } catch (err) {
        return { outputs: [{ target: 'github', status: 'failed', detail: `Identify file tasks: ${errorMessage(err)}` }] }
    }

    if (tasks.length === 0) return { outputs: [skipped('github', 'No file tasks requested in meeting')] }

    // Sequential, like n8n's Split In Batches, so commits don't race on the branch head
    for (const task of tasks) {
        outputs.push(
            await attempt('github', `${task.action} ${task.filename}`, async () => {
                const existing = await getGitHubFile(task.filename)

                const response = await getChatModel(0.2).invoke([
                    [
                        'system',
                        `You are a Senior Software Engineer. Write high-quality, production-ready code for the file: ${task.filename}.

Technical Goal: ${task.goal}

Use the FULL MEETING TRANSCRIPT as your source of truth for implementation details, variables, and logic discussed. Ignore everything else.
Return ONLY the complete file contents — no explanations, no markdown fences.`,
                    ],
                    [
                        'human',
                        `${existing ? `CURRENT FILE CONTENTS:\n${existing.content}\n\n` : ''}FULL TRANSCRIPT Context:\n${transcript}`,
                    ],
                ])

                const link = await commitGitHubFile({
                    path: task.filename,
                    content: stripCodeFences(messageText(response.content)),
                    message: `Meridian AI update: ${task.filename}`,
                    sha: existing?.sha,
                })
                console.log(`[agent:github] SUCCESS! GitHub commit completed for ${task.filename}`)
                return link
            })
        )
    }

    return { outputs }
}

// ─────────────────────────────────────────────────────────────────────────────
// Join
// ─────────────────────────────────────────────────────────────────────────────

export async function finalizeNode(state: PipelineStateType): Promise<PipelineUpdate> {
    const meetingId = requireState(state.meetingId, 'meetingId')
    await setMeetingStatus(meetingId, 'done', { ended_at: new Date().toISOString() })

    const failed = state.outputs.filter((o) => o.status === 'failed').length
    console.log(`[agent] Meeting ${meetingId} complete — ${state.outputs.length} outputs, ${failed} failed`)
    return {}
}
