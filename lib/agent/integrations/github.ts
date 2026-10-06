/**
 * GitHub REST helpers. Replaces the n8n "GitHub: Create Issue" and
 * "GitHub: Commit File Change" nodes.
 *   GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH (optional, defaults to repo default)
 */

const API = 'https://api.github.com'

export function isGitHubConfigured(): boolean {
    return Boolean(process.env.GITHUB_TOKEN && process.env.GITHUB_OWNER && process.env.GITHUB_REPO)
}

function repoPath(): string {
    return `${API}/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}`
}

async function githubFetch(url: string, init: RequestInit = {}): Promise<Response> {
    return fetch(url, {
        ...init,
        headers: {
            Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'Content-Type': 'application/json',
            ...init.headers,
        },
    })
}

/** Create an issue. Returns its html_url. */
export async function createGitHubIssue(title: string, body: string): Promise<string> {
    const res = await githubFetch(`${repoPath()}/issues`, {
        method: 'POST',
        body: JSON.stringify({ title, body }),
    })
    if (!res.ok) throw new Error(`GitHub create issue failed (${res.status}): ${await res.text()}`)
    return (await res.json()).html_url
}

function contentsUrl(filePath: string): string {
    const encoded = filePath.replace(/^\/+/, '').split('/').map(encodeURIComponent).join('/')
    return `${repoPath()}/contents/${encoded}`
}

/** Fetch a file's current content and sha, or null if it doesn't exist. */
export async function getGitHubFile(filePath: string): Promise<{ sha: string; content: string } | null> {
    const branch = process.env.GITHUB_BRANCH
    const res = await githubFetch(`${contentsUrl(filePath)}${branch ? `?ref=${encodeURIComponent(branch)}` : ''}`)
    if (res.status === 404) return null
    if (!res.ok) throw new Error(`GitHub get file failed (${res.status}): ${await res.text()}`)
    const data = await res.json()
    if (Array.isArray(data)) throw new Error(`${filePath} is a directory`)
    return { sha: data.sha, content: Buffer.from(data.content ?? '', 'base64').toString('utf8') }
}

/** Create or update a file in a single commit. Returns the commit html_url. */
export async function commitGitHubFile(input: {
    path: string
    content: string
    message: string
    sha?: string
}): Promise<string> {
    const res = await githubFetch(contentsUrl(input.path), {
        method: 'PUT',
        body: JSON.stringify({
            message: input.message,
            content: Buffer.from(input.content, 'utf8').toString('base64'),
            sha: input.sha,
            branch: process.env.GITHUB_BRANCH || undefined,
        }),
    })
    if (!res.ok) throw new Error(`GitHub commit failed (${res.status}): ${await res.text()}`)
    return (await res.json()).commit?.html_url
}
