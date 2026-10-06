import { END, START, StateGraph } from '@langchain/langgraph'
import { PipelineState } from './state'
import {
    actionItemsNode,
    alertFailureNode,
    codeTasksNode,
    deployBotNode,
    extractNode,
    fetchContextNode,
    finalizeNode,
    ingestRagNode,
    intelligenceDeltaNode,
    notifyNode,
    pollBotNode,
    processRecordingNode,
    routeAfterDeploy,
    routeAfterPoll,
    routeEntry,
    saveMeetingNode,
} from './nodes'

/**
 * Meridian meeting pipeline — LangGraph port of the n8n "Strategic Master" workflow.
 *
 *   START ─┬─▶ deploy_bot ─▶ poll_bot ◀─┐  (self-loop while recording; on Vercel both
 *          │                              │   end early and the run resumes via webhook)
 *          ├──────────────▶ poll_bot ──┴─▶ alert_failure ─▶ END
 *          │                    │
 *          │                    ▼
 *          │            process_recording
 *          │                    │
 *          └──────────────▶ fetch_context
 *                         ┌─────┴─────┐
 *                      extract   intelligence_delta
 *                         └─────┬─────┘
 *                          save_meeting
 *          ┌─────────────┬──────┴──────┬────────────┐
 *     action_items   ingest_rag      notify      code_tasks
 *          └─────────────┴──────┬──────┴────────────┘
 *                            finalize ─▶ END
 */
function buildGraph() {
    return new StateGraph(PipelineState)
        .addNode('deploy_bot', deployBotNode)
        .addNode('poll_bot', pollBotNode)
        .addNode('alert_failure', alertFailureNode)
        .addNode('process_recording', processRecordingNode)
        .addNode('fetch_context', fetchContextNode)
        .addNode('extract', extractNode)
        .addNode('intelligence_delta', intelligenceDeltaNode)
        .addNode('save_meeting', saveMeetingNode)
        .addNode('action_items', actionItemsNode)
        .addNode('ingest_rag', ingestRagNode)
        .addNode('notify', notifyNode)
        .addNode('code_tasks', codeTasksNode)
        .addNode('finalize', finalizeNode)

        .addConditionalEdges(START, routeEntry, ['deploy_bot', 'poll_bot', 'fetch_context'])
        .addConditionalEdges('deploy_bot', routeAfterDeploy, ['poll_bot', END])
        .addConditionalEdges('poll_bot', routeAfterPoll, ['poll_bot', 'process_recording', 'alert_failure', END])
        .addEdge('alert_failure', END)
        .addEdge('process_recording', 'fetch_context')

        .addEdge('fetch_context', 'extract')
        .addEdge('fetch_context', 'intelligence_delta')
        .addEdge(['extract', 'intelligence_delta'], 'save_meeting')

        .addEdge('save_meeting', 'action_items')
        .addEdge('save_meeting', 'ingest_rag')
        .addEdge('save_meeting', 'notify')
        .addEdge('save_meeting', 'code_tasks')
        .addEdge(['action_items', 'ingest_rag', 'notify', 'code_tasks'], 'finalize')
        .addEdge('finalize', END)

        .compile()
}

let compiled: ReturnType<typeof buildGraph> | null = null

export function getMeetingGraph() {
    compiled ??= buildGraph()
    return compiled
}
