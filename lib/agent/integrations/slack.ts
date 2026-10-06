/** Slack incoming-webhook helper. Replaces the n8n "Slack: Error Alert" node. SLACK_WEBHOOK_URL */

export function isSlackConfigured(): boolean {
    return Boolean(process.env.SLACK_WEBHOOK_URL)
}

export async function postToSlack(text: string): Promise<void> {
    const res = await fetch(process.env.SLACK_WEBHOOK_URL!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
    })
    if (!res.ok) throw new Error(`Slack webhook failed (${res.status}): ${await res.text()}`)
}
