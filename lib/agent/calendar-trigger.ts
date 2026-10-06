import { isGoogleConfigured, listCalendarEvents, type CalendarEvent } from './integrations/google'
import { createRun, executeRun, type AgentRun } from './runs'

/**
 * Replaces the n8n "Google Calendar Trigger" (event started, polled every minute)
 * + "Extract Meet Link" nodes. Call pollCalendar() once a minute — from
 * /api/agent/calendar-poll (external cron) or the in-process poller in instrumentation.ts.
 */

// Events already dispatched, so a meeting is only joined once per server process
const seen: Set<string> = ((globalThis as any).__meridianCalendarSeen ??= new Set())

export function extractMeetLink(event: CalendarEvent): string | null {
    if (event.hangoutLink) return event.hangoutLink

    const match = `${event.description ?? ''} ${event.location ?? ''}`.match(/meet\.google\.com\/[a-z0-9-]+/i)
    if (!match) return null

    const url = 'https://' + match[0].split('?')[0].split('#')[0].replace(/[.,;]$/, '')
    return url.length < 25 ? null : url
}

export async function pollCalendar(windowMinutes = 5): Promise<AgentRun[]> {
    if (!isGoogleConfigured()) throw new Error('Google OAuth is not configured')

    const now = new Date()
    const since = new Date(now.getTime() - windowMinutes * 60_000)
    const events = await listCalendarEvents(since, now)

    const started: AgentRun[] = []
    for (const event of events) {
        const startTime = event.start?.dateTime ? new Date(event.start.dateTime) : null
        // Only events that *started* inside the window (all-day events have no dateTime)
        if (!startTime || startTime < since || startTime > now || seen.has(event.id)) continue

        const meetingUrl = extractMeetLink(event)
        if (!meetingUrl) continue

        seen.add(event.id)
        const input = {
            meeting_url: meetingUrl,
            bot_name: 'Meridian Assistant',
            title: event.summary,
            department: process.env.GOOGLE_CALENDAR_DEFAULT_DEPARTMENT,
        }
        const run = await createRun(input)
        console.log(`[agent:calendar] Event "${event.summary}" started — run ${run.id}`)
        void executeRun(run, input)
        started.push(run)
    }
    return started
}
