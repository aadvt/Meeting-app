'use client'

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { formatDistanceToNowStrict } from 'date-fns'
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  FileText,
  KeyRound,
  Link2,
  Loader2,
  Radio,
  Send,
  X,
} from 'lucide-react'

// ── Types mirrored from lib/agent/runs.ts (client-safe copies) ────────────────

type RunStatus = 'running' | 'waiting_for_recording' | 'completed' | 'failed'
type Department = 'eng' | 'fin' | 'mkt'
type Mode = 'link' | 'transcript'

interface OutputLog {
  target: string
  status: 'done' | 'skipped' | 'failed'
  detail: string
  link?: string
}

interface AgentRun {
  id: string
  status: RunStatus
  currentStep?: string
  steps: string[]
  input: { department?: string; title?: string; meeting_url?: string; bot_id?: string; has_transcript?: boolean }
  meetingId?: string
  botId?: string
  botStatus?: string
  outputs: OutputLog[]
  errors: string[]
  error?: string
  startedAt: string
  finishedAt?: string
}

interface AgentConfig {
  recording: boolean
  recordingWait: 'webhook' | 'poll'
  integrations: Record<'gmail' | 'calendar' | 'slack' | 'jira' | 'github' | 'codeCommits', boolean>
}

const DEPARTMENTS: { id: Department; label: string }[] = [
  { id: 'eng', label: 'Engineering' },
  { id: 'fin', label: 'Finance' },
  { id: 'mkt', label: 'Marketing' },
]

const INTEGRATION_LABELS: Record<keyof AgentConfig['integrations'], string> = {
  gmail: 'Gmail',
  calendar: 'Calendar',
  slack: 'Slack',
  jira: 'Jira',
  github: 'GitHub',
  codeCommits: 'Code commits',
}

const MEETING_URL = /^https:\/\/(meet\.google\.com|[\w-]+\.zoom\.us|zoom\.us|teams\.microsoft\.com|teams\.live\.com)\//i

const isActive = (run: AgentRun) => run.status === 'running' || run.status === 'waiting_for_recording'

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw Object.assign(new Error(data.error ?? `Request failed (${res.status})`), { status: res.status })
  return data as T
}

// ── Pipeline stages (graph nodes in lib/agent/graph.ts) ───────────────────────

interface Stage {
  label: string
  /** One node, or several that run in parallel */
  nodes: { key: string; label: string }[]
  appliesTo: (run: AgentRun) => boolean
}

const fromRecording = (run: AgentRun) => !run.input.has_transcript
const always = () => true

const STAGES: Stage[] = [
  { label: 'Send bot to meeting', nodes: [{ key: 'deploy_bot', label: 'Send bot' }], appliesTo: (r) => Boolean(r.input.meeting_url) },
  { label: 'Record meeting', nodes: [{ key: 'poll_bot', label: 'Record' }], appliesTo: fromRecording },
  { label: 'Transcribe recording', nodes: [{ key: 'process_recording', label: 'Transcribe' }], appliesTo: fromRecording },
  { label: 'Recall past meetings', nodes: [{ key: 'fetch_context', label: 'Context' }], appliesTo: always },
  {
    label: 'Analyze',
    nodes: [
      { key: 'extract', label: 'Decisions & actions' },
      { key: 'intelligence_delta', label: 'Change since last meeting' },
    ],
    appliesTo: always,
  },
  { label: 'Save meeting', nodes: [{ key: 'save_meeting', label: 'Save' }], appliesTo: always },
  {
    label: 'Act on results',
    nodes: [
      { key: 'action_items', label: 'Action items' },
      { key: 'ingest_rag', label: 'Memory' },
      { key: 'notify', label: 'Notify' },
      { key: 'code_tasks', label: 'Code tasks' },
    ],
    appliesTo: always,
  },
  { label: 'Finish', nodes: [{ key: 'finalize', label: 'Finish' }], appliesTo: always },
]

type NodeState = 'done' | 'active' | 'waiting' | 'failed' | 'pending'

function nodeStates(run: AgentRun): Map<string, NodeState> {
  const states = new Map<string, NodeState>()
  const stages = STAGES.filter((s) => s.appliesTo(run))
  let frontierFound = false

  for (const stage of stages) {
    const allDone = stage.nodes.every((n) => run.steps.includes(n.key))
    for (const node of stage.nodes) {
      const recordingUnfinished = node.key === 'poll_bot' && (run.status === 'waiting_for_recording' || run.steps.includes('alert_failure'))
      if (run.steps.includes(node.key) && !recordingUnfinished) {
        states.set(node.key, 'done')
      } else if (!frontierFound) {
        states.set(
          node.key,
          run.status === 'waiting_for_recording' ? 'waiting' : run.status === 'failed' ? 'failed' : run.status === 'running' ? 'active' : 'pending'
        )
      } else {
        states.set(node.key, 'pending')
      }
    }
    if (!allDone || stage.nodes.some((n) => states.get(n.key) !== 'done')) frontierFound = true
  }
  return states
}

function runTitle(run: AgentRun): string {
  if (run.input.title) return run.input.title
  if (run.input.meeting_url) return run.input.meeting_url.replace(/^https:\/\//, '')
  return run.input.has_transcript ? 'Pasted transcript' : `Bot ${run.botId?.slice(0, 8) ?? ''}`
}

// ── Small pieces ──────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<RunStatus, { label: string; className: string }> = {
  running: { label: 'Running', className: 'bg-cyan-400/15 text-cyan-200 ring-cyan-400/30' },
  waiting_for_recording: { label: 'Recording', className: 'bg-rose-400/15 text-rose-200 ring-rose-400/30' },
  completed: { label: 'Done', className: 'bg-emerald-400/15 text-emerald-200 ring-emerald-400/30' },
  failed: { label: 'Failed', className: 'bg-red-500/15 text-red-200 ring-red-500/30' },
}

function StatusPill({ status }: { status: RunStatus }) {
  const style = STATUS_STYLE[status]
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${style.className}`}>
      {status === 'running' && <Loader2 className="h-3 w-3 animate-spin" aria-hidden />}
      {status === 'waiting_for_recording' && <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" aria-hidden />}
      {style.label}
    </span>
  )
}

function StepDot({ state }: { state: NodeState }) {
  return (
    <span className="relative flex h-5 w-5 shrink-0 items-center justify-center" aria-hidden>
      {(state === 'active' || state === 'waiting') && (
        <motion.span
          className={`absolute inset-0 rounded-full ${state === 'waiting' ? 'bg-rose-400/30' : 'bg-cyan-400/30'}`}
          animate={{ scale: [1, 1.7], opacity: [0.7, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: [0.16, 1, 0.3, 1] }}
        />
      )}
      <motion.span
        layout
        initial={false}
        animate={{ scale: state === 'done' ? 1 : 0.85 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={`relative flex h-5 w-5 items-center justify-center rounded-full border ${
          state === 'done'
            ? 'border-cyan-300 bg-cyan-300 text-cyan-950'
            : state === 'active'
              ? 'border-cyan-300 bg-slate-950'
              : state === 'waiting'
                ? 'border-rose-300 bg-slate-950'
                : state === 'failed'
                  ? 'border-red-400 bg-red-500 text-white'
                  : 'border-white/20 bg-slate-950'
        }`}
      >
        {state === 'done' && <Check className="h-3 w-3" strokeWidth={3} />}
        {state === 'failed' && <X className="h-3 w-3" strokeWidth={3} />}
        {state === 'active' && <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />}
        {state === 'waiting' && <span className="h-1.5 w-1.5 rounded-full bg-rose-300" />}
      </motion.span>
    </span>
  )
}

function Timeline({ run }: { run: AgentRun }) {
  const states = nodeStates(run)
  const stages = STAGES.filter((s) => s.appliesTo(run))

  return (
    <ol className="relative space-y-1">
      {stages.map((stage, i) => {
        const stageStates = stage.nodes.map((n) => states.get(n.key) ?? 'pending')
        const stageState: NodeState = stageStates.every((s) => s === 'done')
          ? 'done'
          : (stageStates.find((s) => s !== 'done' && s !== 'pending') ?? 'pending')
        const isLast = i === stages.length - 1

        return (
          <li key={stage.label} className="relative flex gap-3 pb-3">
            {!isLast && (
              <span
                className={`absolute left-[9.5px] top-6 bottom-0 w-px transition-colors duration-500 ${stageState === 'done' ? 'bg-cyan-300/50' : 'bg-white/10'}`}
                aria-hidden
              />
            )}
            <StepDot state={stageState} />
            <div className="min-w-0 flex-1 pt-px">
              <p className={`text-sm leading-5 ${stageState === 'pending' ? 'text-white/40' : 'text-white'}`}>
                {stage.nodes[0].key === 'poll_bot' && stageState === 'waiting' ? 'Recording — processing starts when the meeting ends' : stage.label}
              </p>
              {stage.nodes.length > 1 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {stage.nodes.map((node) => {
                    const s = states.get(node.key) ?? 'pending'
                    return (
                      <span
                        key={node.key}
                        className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors duration-300 ${
                          s === 'done'
                            ? 'bg-cyan-300/10 text-cyan-100'
                            : s === 'active'
                              ? 'bg-white/10 text-white'
                              : s === 'failed'
                                ? 'bg-red-500/15 text-red-200'
                                : 'bg-white/5 text-white/40'
                        }`}
                      >
                        {s === 'done' ? <Check className="h-3 w-3" /> : s === 'active' ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                        {node.label}
                      </span>
                    )
                  })}
                </div>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

const TARGET_LABELS: Record<string, string> = {
  supabase: 'Database',
  rag: 'Memory',
  gmail: 'Gmail',
  calendar: 'Calendar',
  jira: 'Jira',
  github: 'GitHub',
  slack: 'Slack',
}

function Outputs({ outputs }: { outputs: OutputLog[] }) {
  const sorted = [...outputs].sort((a, b) => ({ failed: 0, done: 1, skipped: 2 })[a.status] - ({ failed: 0, done: 1, skipped: 2 })[b.status])
  if (sorted.length === 0) return <p className="text-sm text-white/50">Results appear here as each step finishes.</p>

  return (
    <ul className="divide-y divide-white/5">
      {sorted.map((o, i) => (
        <li key={i} className={`flex items-start gap-3 py-2 text-sm ${o.status === 'skipped' ? 'text-white/45' : 'text-white/85'}`}>
          <span className="w-20 shrink-0 text-xs leading-5 text-white/50">{TARGET_LABELS[o.target] ?? o.target}</span>
          <span className="min-w-0 flex-1 break-words leading-5">
            {o.status === 'failed' && <AlertTriangle className="mr-1.5 inline h-3.5 w-3.5 -translate-y-px text-red-300" aria-label="Failed" />}
            {o.detail}
          </span>
          {o.link && (
            <a
              href={o.link}
              target="_blank"
              rel="noreferrer"
              className="inline-flex shrink-0 items-center gap-0.5 rounded text-xs leading-5 text-cyan-300 hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              Open <ArrowUpRight className="h-3 w-3" />
            </a>
          )}
        </li>
      ))}
    </ul>
  )
}

function RunDetail({ run }: { run: AgentRun }) {
  const [showSkipped, setShowSkipped] = useState(false)
  const visible = showSkipped ? run.outputs : run.outputs.filter((o) => o.status !== 'skipped')
  const skippedCount = run.outputs.length - run.outputs.filter((o) => o.status !== 'skipped').length

  return (
    <motion.div
      key={run.id}
      initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="grid gap-6 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]"
    >
      <div>
        <h4 className="mb-3 text-sm font-medium text-white/70">Pipeline</h4>
        <Timeline run={run} />
      </div>
      <div className="min-w-0">
        <div className="mb-1 flex items-baseline justify-between gap-3">
          <h4 className="text-sm font-medium text-white/70">Results</h4>
          {skippedCount > 0 && (
            <button
              type="button"
              onClick={() => setShowSkipped((v) => !v)}
              className="rounded text-xs text-white/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              {showSkipped ? 'Hide' : 'Show'} {skippedCount} skipped
            </button>
          )}
        </div>
        {run.error && (
          <div role="alert" className="mb-3 flex gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-200 ring-1 ring-inset ring-red-500/25">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span className="min-w-0 break-words">{run.error}</span>
          </div>
        )}
        <Outputs outputs={visible} />
        {run.meetingId && (
          <p className="mt-4 text-xs text-white/40">
            Meeting <span className="font-mono">{run.meetingId.slice(0, 8)}</span>
            {run.botId && (
              <>
                {' · '}Bot <span className="font-mono">{run.botId.slice(0, 8)}</span>
              </>
            )}
          </p>
        )}
      </div>
    </motion.div>
  )
}

function AccessGate({ onGranted }: { onGranted: () => void }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await api('/api/access', { method: 'POST', body: JSON.stringify({ code }) })
      onGranted()
    } catch {
      setError('That code didn’t work. Check it with whoever set up Meridian.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="max-w-sm space-y-3">
      <div>
        <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
          <KeyRound className="h-4 w-4 text-cyan-300" aria-hidden /> Enter access code
        </h3>
        <p className="mt-1 text-sm text-white/60">The agent spends API credits, so it’s locked to your team.</p>
      </div>
      <input
        type="password"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        autoFocus
        aria-label="Access code"
        aria-invalid={Boolean(error)}
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-cyan-300/60 focus:outline-none focus:ring-2 focus:ring-cyan-300/20"
        placeholder="Access code"
      />
      {error && <p className="text-sm text-red-300">{error}</p>}
      <button
        type="submit"
        disabled={!code || busy}
        className="inline-flex items-center gap-2 rounded-lg bg-cyan-300 px-4 py-2 text-sm font-semibold text-cyan-950 transition-colors hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Unlock
      </button>
    </form>
  )
}

// ── Console ───────────────────────────────────────────────────────────────────

export default function AgentConsole() {
  const [access, setAccess] = useState<'checking' | 'granted' | 'required'>('checking')
  const [config, setConfig] = useState<AgentConfig | null>(null)
  const [runs, setRuns] = useState<AgentRun[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [mode, setMode] = useState<Mode>('link')
  const [department, setDepartment] = useState<Department>('eng')
  const [title, setTitle] = useState('')
  const [meetingUrl, setMeetingUrl] = useState('')
  const [transcript, setTranscript] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const checkAccess = useCallback(async () => {
    try {
      const res = await api<{ granted: boolean }>('/api/access')
      setAccess(res.granted ? 'granted' : 'required')
    } catch {
      setAccess('granted') // gate not reachable — let the API calls report errors
    }
  }, [])

  const loadRuns = useCallback(async () => {
    try {
      const { runs } = await api<{ runs: AgentRun[] }>('/api/agent/runs?limit=12')
      setRuns(runs)
      setSelectedId((id) => id ?? runs[0]?.id ?? null)
      setLoadError(null)
    } catch (err: any) {
      if (err.status === 401) setAccess('required')
      else setLoadError('Couldn’t load runs. Is the database configured?')
    }
  }, [])

  useEffect(() => {
    checkAccess()
  }, [checkAccess])

  useEffect(() => {
    if (access !== 'granted') return
    loadRuns()
    api<AgentConfig>('/api/agent/config').then(setConfig).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [access])

  const selected = runs.find((r) => r.id === selectedId) ?? null
  const anyActive = runs.some(isActive)

  // The selected run polls its own endpoint (which also resumes runs whose recording finished)
  useEffect(() => {
    if (!selected || !isActive(selected)) return
    const id = selected.id
    const timer = setInterval(async () => {
      try {
        const run = await api<AgentRun>(`/api/agent/runs/${id}`)
        setRuns((prev) => prev.map((r) => (r.id === id ? run : r)))
      } catch {}
    }, selected.status === 'waiting_for_recording' ? 10_000 : 2_500)
    return () => clearInterval(timer)
  }, [selected?.id, selected?.status]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (access !== 'granted' || !anyActive) return
    const timer = setInterval(loadRuns, 8_000)
    return () => clearInterval(timer)
  }, [access, anyActive, loadRuns])

  const urlInvalid = mode === 'link' && meetingUrl.trim() !== '' && !MEETING_URL.test(meetingUrl.trim())
  const canSubmit = !submitting && (mode === 'link' ? MEETING_URL.test(meetingUrl.trim()) : transcript.trim().length > 20)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const body =
        mode === 'link'
          ? { meeting_url: meetingUrl.trim(), department, title: title.trim() || undefined }
          : { transcript: transcript.trim(), department, title: title.trim() || undefined }
      const { run_id } = await api<{ run_id: string }>('/api/agent/trigger', { method: 'POST', body: JSON.stringify(body) })
      const run = await api<AgentRun>(`/api/agent/runs/${run_id}`)
      setRuns((prev) => [run, ...prev.filter((r) => r.id !== run.id)])
      setSelectedId(run.id)
      setMeetingUrl('')
      setTranscript('')
      setTitle('')
    } catch (err: any) {
      if (err.status === 401) setAccess('required')
      setSubmitError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass =
    'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/40 transition-colors hover:border-white/20 focus:border-cyan-300/60 focus:outline-none focus:ring-2 focus:ring-cyan-300/20'

  return (
    <section aria-labelledby="agent-heading" className="glass overflow-hidden">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/10 px-5 py-4 sm:px-6">
        <div>
          <h2 id="agent-heading" className="text-xl font-semibold text-white">Meeting agent</h2>
          <p className="mt-0.5 text-sm text-white/60">Send a bot to a call or paste a transcript. Meridian takes notes, files the follow-ups and remembers it for next time.</p>
        </div>
        {config && (
          <ul className="flex flex-wrap gap-1.5" aria-label="Connected integrations">
            {(Object.keys(INTEGRATION_LABELS) as (keyof AgentConfig['integrations'])[]).map((key) => (
              <li
                key={key}
                title={config.integrations[key] ? 'Connected' : 'Not configured — add its keys to the environment'}
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${
                  config.integrations[key] ? 'bg-emerald-400/10 text-emerald-200' : 'bg-white/5 text-white/40'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${config.integrations[key] ? 'bg-emerald-300' : 'bg-white/25'}`} aria-hidden />
                {INTEGRATION_LABELS[key]}
                <span className="sr-only">{config.integrations[key] ? 'connected' : 'not configured'}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {access === 'checking' ? (
        <div className="flex items-center gap-2 px-6 py-10 text-sm text-white/50">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Connecting…
        </div>
      ) : access === 'required' ? (
        <div className="px-5 py-8 sm:px-6">
          <AccessGate onGranted={() => setAccess('granted')} />
        </div>
      ) : (
        <div className="grid lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
          {/* ── Composer ── */}
          <form onSubmit={submit} className="space-y-5 border-b border-white/10 p-5 sm:p-6 lg:border-b-0 lg:border-r">
            <div role="tablist" aria-label="Source" className="grid grid-cols-2 rounded-lg bg-black/25 p-1">
              {([
                { id: 'link', label: 'Meeting link', icon: Link2 },
                { id: 'transcript', label: 'Transcript', icon: FileText },
              ] as const).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={mode === id}
                  onClick={() => setMode(id)}
                  className={`relative inline-flex items-center justify-center gap-2 rounded-md py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
                    mode === id ? 'text-white' : 'text-white/55 hover:text-white/80'
                  }`}
                >
                  {mode === id && (
                    <motion.span layoutId="agent-mode" className="absolute inset-0 rounded-md bg-white/10 ring-1 ring-inset ring-white/10" transition={{ type: 'spring', stiffness: 500, damping: 40 }} />
                  )}
                  <Icon className="relative h-4 w-4" aria-hidden />
                  <span className="relative">{label}</span>
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait" initial={false}>
              {mode === 'link' ? (
                <motion.div key="link" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  <label htmlFor="agent-url" className="mb-1.5 block text-sm text-white/75">Meeting link</label>
                  <input
                    id="agent-url"
                    type="url"
                    inputMode="url"
                    value={meetingUrl}
                    onChange={(e) => setMeetingUrl(e.target.value)}
                    placeholder="https://meet.google.com/abc-defg-hij"
                    aria-invalid={urlInvalid}
                    aria-describedby="agent-url-hint"
                    className={inputClass}
                  />
                  <p id="agent-url-hint" className={`mt-1.5 text-xs ${urlInvalid ? 'text-amber-200' : 'text-white/45'}`}>
                    {urlInvalid
                      ? 'Use a full Google Meet, Zoom or Teams link starting with https://'
                      : config && !config.recording
                        ? 'Recording keys aren’t configured on the server yet.'
                        : 'The bot joins as a participant. Admit it from the waiting room.'}
                  </p>
                </motion.div>
              ) : (
                <motion.div key="transcript" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  <label htmlFor="agent-transcript" className="mb-1.5 block text-sm text-white/75">Transcript</label>
                  <textarea
                    id="agent-transcript"
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    rows={7}
                    placeholder={'Sarah: Let’s ship the auth service on REST.\nTom: Agreed — I’ll write the README by Friday.'}
                    className={`${inputClass} resize-y leading-relaxed`}
                  />
                  <p className="mt-1.5 text-xs text-white/45">One line per speaker turn, as “Name: what they said”.</p>
                </motion.div>
              )}
            </AnimatePresence>

            <fieldset>
              <legend className="mb-1.5 text-sm text-white/75">Department</legend>
              <div className="flex flex-wrap gap-1.5">
                {DEPARTMENTS.map((d) => (
                  <label
                    key={d.id}
                    className={`cursor-pointer rounded-full px-3 py-1.5 text-sm ring-1 ring-inset transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-cyan-300 ${
                      department === d.id ? 'bg-cyan-300/15 text-cyan-100 ring-cyan-300/40' : 'text-white/60 ring-white/10 hover:text-white hover:ring-white/25'
                    }`}
                  >
                    <input type="radio" name="department" value={d.id} checked={department === d.id} onChange={() => setDepartment(d.id)} className="sr-only" />
                    {d.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <div>
              <label htmlFor="agent-title" className="mb-1.5 block text-sm text-white/75">
                Title <span className="text-white/40">(optional)</span>
              </label>
              <input id="agent-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Auth service review" className={inputClass} />
            </div>

            {submitError && (
              <p role="alert" className="text-sm text-red-300">{submitError}</p>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-cyan-950 shadow-[0_8px_24px_-8px_rgba(103,232,249,0.5)] transition-[background-color,box-shadow,opacity] hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : mode === 'link' ? <Radio className="h-4 w-4" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
              {submitting ? 'Starting…' : mode === 'link' ? 'Send bot to meeting' : 'Process transcript'}
            </button>
          </form>

          {/* ── Runs ── */}
          <div className="min-w-0 p-5 sm:p-6">
            {loadError ? (
              <p role="alert" className="text-sm text-red-300">{loadError}</p>
            ) : runs.length === 0 ? (
              <div className="flex h-full min-h-48 flex-col justify-center">
                <p className="text-base text-white">No runs yet</p>
                <p className="mt-1 max-w-md text-sm text-white/55">
                  Start one on the left. You’ll see each step here as it happens — recording, transcription, analysis, and every ticket, email and memory it creates.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <ul className="-mx-2 flex gap-1 overflow-x-auto px-2 pb-1 [scrollbar-width:thin]" aria-label="Recent runs">
                  {runs.map((run) => (
                    <li key={run.id} className="shrink-0">
                      <button
                        type="button"
                        onClick={() => setSelectedId(run.id)}
                        aria-current={run.id === selectedId}
                        className={`flex w-56 flex-col items-start gap-1.5 rounded-lg px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
                          run.id === selectedId ? 'bg-white/10 ring-1 ring-inset ring-white/15' : 'hover:bg-white/5'
                        }`}
                      >
                        <span className="w-full truncate text-sm text-white">{runTitle(run)}</span>
                        <span className="flex w-full items-center justify-between gap-2 text-xs text-white/50">
                          <span className="truncate">
                            {DEPARTMENTS.find((d) => d.id === run.input.department)?.label ?? 'Engineering'} ·{' '}
                            {formatDistanceToNowStrict(new Date(run.startedAt), { addSuffix: true })}
                          </span>
                          <StatusPill status={run.status} />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                <AnimatePresence mode="wait">{selected && <RunDetail key={selected.id} run={selected} />}</AnimatePresence>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
