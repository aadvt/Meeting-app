/**
 * Runs once when the Next.js server starts. With AGENT_CALENDAR_POLL=true it polls
 * Google Calendar every minute (replacing the n8n Google Calendar Trigger) without
 * needing an external cron. Only suitable for a long-lived server (`next start` / `next dev`).
 */
export async function register() {
    if (process.env.NEXT_RUNTIME !== 'nodejs' || process.env.AGENT_CALENDAR_POLL !== 'true') return

    const { pollCalendar } = await import('./lib/agent/calendar-trigger')
    const g = globalThis as any
    if (g.__meridianCalendarInterval) return

    g.__meridianCalendarInterval = setInterval(() => {
        pollCalendar().catch((err) => console.error('[agent:calendar] poll failed:', err))
    }, 60_000)
    console.log('[agent:calendar] In-process Google Calendar polling enabled (every 60s)')
}
