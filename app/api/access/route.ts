import { NextRequest, NextResponse } from 'next/server'
import { ACCESS_COOKIE, accessToken, isAccessGateEnabled } from '@/lib/access'

/** GET /api/access — whether this browser already has API access. */
export async function GET(req: NextRequest) {
    if (!isAccessGateEnabled()) return NextResponse.json({ required: false, granted: true })
    const granted = req.cookies.get(ACCESS_COOKIE)?.value === (await accessToken())
    return NextResponse.json({ required: true, granted })
}

/** POST /api/access { code } — exchange the shared access code for an httpOnly cookie. */
export async function POST(req: NextRequest) {
    if (!isAccessGateEnabled()) return NextResponse.json({ granted: true })

    const { code } = await req.json().catch(() => ({ code: '' }))
    if (typeof code !== 'string' || (await accessToken(code)) !== (await accessToken())) {
        return NextResponse.json({ error: 'Invalid access code' }, { status: 401 })
    }

    const res = NextResponse.json({ granted: true })
    res.cookies.set(ACCESS_COOKIE, await accessToken(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
    })
    return res
}
