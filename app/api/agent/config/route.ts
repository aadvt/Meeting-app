import { NextResponse } from 'next/server'
import { deferRecordingWait } from '@/lib/agent/nodes'
import { isGoogleConfigured } from '@/lib/agent/integrations/google'
import { isJiraConfigured } from '@/lib/agent/integrations/jira'
import { isGitHubConfigured } from '@/lib/agent/integrations/github'
import { isSlackConfigured } from '@/lib/agent/integrations/slack'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** GET /api/agent/config — which integrations are configured (booleans only, never secrets). */
export async function GET() {
    return NextResponse.json({
        recording: Boolean(process.env.RECALL_API_KEY && process.env.DEEPGRAM_API_KEY),
        recordingWait: deferRecordingWait() ? 'webhook' : 'poll',
        llm: process.env.LLM_PROVIDER === 'openai' ? 'openai' : 'gemini',
        integrations: {
            gmail: isGoogleConfigured(),
            calendar: isGoogleConfigured(),
            slack: isSlackConfigured(),
            jira: isJiraConfigured(),
            github: isGitHubConfigured(),
            codeCommits: isGitHubConfigured() && process.env.AGENT_ENABLE_CODE_COMMITS === 'true',
        },
    })
}
