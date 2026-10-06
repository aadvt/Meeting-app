/**
 * Shared-access-code gate for the API (see proxy.ts). When MERIDIAN_ACCESS_CODE is set,
 * API calls need either the access cookie (set by POST /api/access from the UI) or an
 * `x-webhook-secret` header matching MERIDIAN_WEBHOOK_SECRET (for scripts / external triggers).
 */

export const ACCESS_COOKIE = 'meridian_access'

export function isAccessGateEnabled(): boolean {
    return Boolean(process.env.MERIDIAN_ACCESS_CODE)
}

/** Cookie value for the configured code: a hash, so the code itself never sits in the browser. */
export async function accessToken(code = process.env.MERIDIAN_ACCESS_CODE ?? ''): Promise<string> {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`meridian:${code}`))
    return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}
