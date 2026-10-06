/**
 * Google Workspace helpers (Gmail drafts, Calendar events, Calendar polling).
 *
 * Replaces the n8n Gmail / Google Calendar / Google Calendar Trigger nodes.
 * Auth uses an OAuth2 refresh token so no interactive login is needed at runtime:
 *   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN
 * The refresh token needs the scopes:
 *   https://www.googleapis.com/auth/gmail.compose
 *   https://www.googleapis.com/auth/calendar.events
 */

let cachedToken: { value: string; expiresAt: number } | null = null

export function isGoogleConfigured(): boolean {
    return Boolean(
        process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN
    )
}

async function getAccessToken(): Promise<string> {
    if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value

    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            refresh_token: process.env.GOOGLE_REFRESH_TOKEN!,
            grant_type: 'refresh_token',
        }),
    })
    if (!res.ok) throw new Error(`Google token refresh failed (${res.status}): ${await res.text()}`)

    const data = await res.json()
    cachedToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 }
    return cachedToken.value
}

async function googleFetch(url: string, init: RequestInit = {}): Promise<any> {
    const token = await getAccessToken()
    const res = await fetch(url, {
        ...init,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...init.headers },
    })
    if (!res.ok) throw new Error(`Google API error (${res.status}) ${url}: ${await res.text()}`)
    return res.json()
}

function base64Url(input: string): string {
    return Buffer.from(input, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** Create a Gmail draft. Returns the draft id. */
export async function createGmailDraft(subject: string, body: string, to = process.env.GMAIL_DRAFT_TO): Promise<string> {
    const headers = [
        to ? `To: ${to}` : null,
        `Subject: =?UTF-8?B?${Buffer.from(subject, 'utf8').toString('base64')}?=`,
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset="UTF-8"',
    ].filter(Boolean)

    const raw = base64Url(`${headers.join('\r\n')}\r\n\r\n${body}`)
    const data = await googleFetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
        method: 'POST',
        body: JSON.stringify({ message: { raw } }),
    })
    return data.id
}

/** Create a Google Calendar event. Returns the event's htmlLink. */
export async function createCalendarEvent(input: {
    summary: string
    description: string
    start: Date
    end: Date
    calendarId?: string
}): Promise<string> {
    const calendarId = encodeURIComponent(input.calendarId ?? process.env.GOOGLE_CALENDAR_ID ?? 'primary')
    const data = await googleFetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`, {
        method: 'POST',
        body: JSON.stringify({
            summary: input.summary,
            description: input.description,
            start: { dateTime: input.start.toISOString() },
            end: { dateTime: input.end.toISOString() },
        }),
    })
    return data.htmlLink
}

export interface CalendarEvent {
    id: string
    summary?: string
    description?: string
    location?: string
    hangoutLink?: string
    start?: { dateTime?: string; date?: string }
}

/** List single events whose time range overlaps [timeMin, timeMax]. */
export async function listCalendarEvents(timeMin: Date, timeMax: Date, calendarId?: string): Promise<CalendarEvent[]> {
    const id = encodeURIComponent(calendarId ?? process.env.GOOGLE_CALENDAR_ID ?? 'primary')
    const params = new URLSearchParams({
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime',
    })
    const data = await googleFetch(`https://www.googleapis.com/calendar/v3/calendars/${id}/events?${params}`)
    return data.items ?? []
}
