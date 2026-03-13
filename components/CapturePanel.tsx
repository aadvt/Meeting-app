"use client"

import { useState } from "react"

type Department = "eng" | "fin" | "mkt"
type Mode = "meet" | "manual"
type Status = "idle" | "joining" | "recording" | "processing" | "done" | "error"

interface CaptureResult {
  meeting_id: string
  decisions: number
  actions: number
  risks: number
  contradictions: number
}

export default function CapturePanel() {
  const [mode, setMode] = useState<Mode>("manual")
  const [department, setDepartment] = useState<Department>("eng")
  const [meetUrl, setMeetUrl] = useState("")
  const [meetingTitle, setMeetingTitle] = useState("")
  const [transcript, setTranscript] = useState("")
  const [status, setStatus] = useState<Status>("idle")
  const [botId, setBotId] = useState<string | null>(null)
  const [result, setResult] = useState<CaptureResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState("")

  const deptLabels: Record<Department, string> = {
    eng: "Engineering", fin: "Finance", mkt: "Marketing"
  }

  async function startMeetingCapture() {
    setStatus("joining")
    setError(null)
    setStatusMessage("Sending bot to meeting...")

    try {
      const meetingId = crypto.randomUUID()

      const res = await fetch("/api/capture/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meeting_url: meetUrl,
          department,
          meeting_id: meetingId,
          meeting_title: meetingTitle || "Live Meeting",
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setBotId(data.bot_id)
      setStatus("recording")
      setStatusMessage("Bot is recording. Click Stop when meeting ends.")

      pollBotStatus(data.bot_id)

    } catch (e: any) {
      setStatus("error")
      setError(e.message)
    }
  }

  async function pollBotStatus(bid: string) {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/capture/status?bot_id=${bid}`)
        const data = await res.json()

        if (data.status === "processing") {
          setStatusMessage("Meeting ended. Processing transcript...")
          setStatus("processing")
        }
        if (data.status === "done") {
          clearInterval(interval)
          setStatus("done")
          setStatusMessage("Done! Knowledge graph updated.")
        }
        if (data.status === "error") {
          clearInterval(interval)
          setStatus("error")
          setError("Bot encountered an error")
        }
      } catch {
      }
    }, 5000)
  }

  async function stopBot() {
    if (!botId) return
    setStatusMessage("Stopping bot and processing transcript...")
    await fetch("/api/capture/stop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bot_id: botId })
    })
    setStatus("processing")
  }

  async function submitManualTranscript() {
    if (!transcript.trim()) return
    setStatus("processing")
    setError(null)
    setStatusMessage("Extracting insights with Gemini...")

    try {
      const res = await fetch("/api/capture/manual-transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript,
          department,
          meeting_title: meetingTitle || "Manual Transcript",
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setStatus("done")
      setResult({
        meeting_id: data.meeting_id,
        decisions: data.summary.decisions,
        actions: data.summary.actions,
        risks: data.summary.risks,
        contradictions: data.summary.contradictions,
      })
      setStatusMessage("Done! Knowledge graph updated.")

    } catch (e: any) {
      setStatus("error")
      setError(e.message)
    }
  }

  return (
    <div className="bg-gray-950 border border-gray-800 rounded-xl p-6 space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-mono text-sm font-semibold tracking-wide uppercase">New Meeting</h2>
          <p className="text-gray-500 text-xs mt-0.5">Capture → Transcribe → Extract → Graph</p>
        </div>
        {status === "recording" && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-red-400 text-xs font-mono">RECORDING</span>
          </div>
        )}
      </div>

      <div className="flex rounded-lg overflow-hidden border border-gray-800">
        {(["manual", "meet"] as Mode[]).map((m) => (
          <button key={m} onClick={() => setMode(m)}
            className={`flex-1 py-2 text-xs font-mono transition-colors ${mode === m ? "bg-gray-800 text-white" : "text-gray-500 hover:text-gray-300"}`}>
            {m === "manual" ? "Paste Transcript" : "Google Meet (Live)"}
          </button>
        ))}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-mono text-gray-500 uppercase tracking-wide">Department</label>
        <div className="flex gap-2">
          {(["eng", "fin", "mkt"] as Department[]).map((d) => (
            <button key={d} onClick={() => setDepartment(d)}
              className={`px-4 py-1.5 rounded-full text-xs font-mono transition-all border ${department === d ? "bg-gray-700 text-white border-gray-600" : "text-gray-500 border-gray-800 hover:text-gray-300"}`}>
              {deptLabels[d]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-mono text-gray-500 uppercase tracking-wide">Meeting Title</label>
        <input value={meetingTitle} onChange={(e) => setMeetingTitle(e.target.value)}
          placeholder="e.g. Auth Service Review"
          className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-600" />
      </div>

      {mode === "meet" ? (
        <div className="space-y-1.5">
          <label className="text-xs font-mono text-gray-500 uppercase tracking-wide">Google Meet URL</label>
          <input value={meetUrl} onChange={(e) => setMeetUrl(e.target.value)}
            placeholder="https://meet.google.com/abc-defg-hij"
            className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-600" />
        </div>
      ) : (
        <div className="space-y-1.5">
          <label className="text-xs font-mono text-gray-500 uppercase tracking-wide">Transcript</label>
          <textarea value={transcript} onChange={(e) => setTranscript(e.target.value)}
            rows={8} placeholder={"Sarah: We decided to migrate to GraphQL...\nTom: Agreed, I'll own the implementation..."}
            className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-600 resize-none font-mono" />
        </div>
      )}

      {statusMessage && (
        <div className={`text-xs font-mono px-3 py-2 rounded-lg border ${
          status === "error" ? "text-red-400 bg-red-950/30 border-red-900" :
            status === "done" ? "text-green-400 bg-green-950/30 border-green-900" :
              "text-amber-400 bg-amber-950/30 border-amber-900"
          }`}>
          {status === "processing" && <span className="animate-pulse">⟳ </span>}
          {statusMessage}
        </div>
      )}

      {error && <p className="text-red-400 text-xs font-mono">⚠ {error}</p>}

      <div className="flex gap-3">
        {status === "recording" ? (
          <button onClick={stopBot}
            className="flex-1 bg-red-600 hover:bg-red-500 text-white text-sm font-mono py-2.5 rounded-lg transition-colors">
            ◼ Stop & Process
          </button>
        ) : (
          <button
            onClick={mode === "meet" ? startMeetingCapture : submitManualTranscript}
            disabled={status === "processing" || (mode === "meet" ? !meetUrl : !transcript.trim())}
            className="flex-1 bg-white text-gray-950 text-sm font-mono py-2.5 rounded-lg transition-colors hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
            {status === "processing" ? "Processing…" : mode === "meet" ? "▶ Send Bot to Meeting" : "⚡ Extract & Ingest"}
          </button>
        )}
      </div>

      {result && status === "done" && (
        <div className="border border-gray-800 rounded-lg p-4 space-y-3">
          <p className="text-xs font-mono text-gray-400 uppercase tracking-wide">Extraction Complete</p>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Decisions", value: result.decisions, color: "text-amber-400" },
              { label: "Actions", value: result.actions, color: "text-blue-400" },
              { label: "Risks", value: result.risks, color: "text-red-400" },
              { label: "Conflicts", value: result.contradictions, color: "text-red-500" },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center">
                <p className={`text-2xl font-mono font-bold ${color}`}>{value}</p>
                <p className="text-xs text-gray-600">{label}</p>
              </div>
            ))}
          </div>
          <a href={`/meetings/${result.meeting_id}`}
            className="block text-center text-xs font-mono text-purple-400 hover:text-purple-300 transition-colors mt-2">
            View in Knowledge Graph →
          </a>
        </div>
      )}
    </div>
  )
}
