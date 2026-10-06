import { NextRequest, NextResponse } from 'next/server'
import { ACCESS_COOKIE, accessToken, isAccessGateEnabled } from '@/lib/access'

// Called by third parties that can't hold the access cookie; each verifies on its own
// (Recall webhooks act only on known bots and re-check status with Recall, the cron uses CRON_SECRET).
const PUBLIC_API = ['/api/access', '/api/recall/webhook', '/api/capture/transcript-webhook', '/api/agent/calendar-poll']

export async function proxy(req: NextRequest) {
    if (!isAccessGateEnabled() || PUBLIC_API.includes(req.nextUrl.pathname)) return NextResponse.next()

    const secret = process.env.MERIDIAN_WEBHOOK_SECRET
    if (secret && req.headers.get('x-webhook-secret') === secret) return NextResponse.next()
    if (req.cookies.get(ACCESS_COOKIE)?.value === (await accessToken())) return NextResponse.next()

    return NextResponse.json({ error: 'access code required' }, { status: 401 })
}

export const config = {
    matcher: '/api/:path*',
}
