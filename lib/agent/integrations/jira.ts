/**
 * Jira REST helper. Replaces the n8n "Create an issue" (Jira) node.
 *   JIRA_BASE_URL (e.g. https://your-site.atlassian.net), JIRA_EMAIL, JIRA_API_TOKEN,
 *   JIRA_PROJECT_ID (n8n used 10035), JIRA_ISSUE_TYPE_ID (n8n used 10043 "Idea")
 */

export function isJiraConfigured(): boolean {
    return Boolean(
        process.env.JIRA_BASE_URL &&
            process.env.JIRA_EMAIL &&
            process.env.JIRA_API_TOKEN &&
            process.env.JIRA_PROJECT_ID &&
            process.env.JIRA_ISSUE_TYPE_ID
    )
}

/** Create an issue. Returns its browse URL. */
export async function createJiraIssue(summary: string, description: string): Promise<string> {
    const base = process.env.JIRA_BASE_URL!.replace(/\/+$/, '')
    const auth = Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64')

    // v2 accepts a plain-text description (v3 requires Atlassian Document Format)
    const res = await fetch(`${base}/rest/api/2/issue`, {
        method: 'POST',
        headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
            fields: {
                project: { id: process.env.JIRA_PROJECT_ID },
                issuetype: { id: process.env.JIRA_ISSUE_TYPE_ID },
                summary: summary.slice(0, 254),
                description,
            },
        }),
    })
    if (!res.ok) throw new Error(`Jira create issue failed (${res.status}): ${await res.text()}`)
    const data = await res.json()
    return `${base}/browse/${data.key}`
}
