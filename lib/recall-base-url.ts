export function getRecallApiBaseUrl(): string {
  const explicit = process.env.RECALL_API_BASE_URL?.trim()
  if (explicit) {
    return explicit.replace(/\/+$/, '')
  }

  const region = (process.env.RECALL_REGION ?? 'us-east-1').trim()
  return `https://${region}.recall.ai/api/v1`
}
