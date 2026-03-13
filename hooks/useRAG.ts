import { useState } from 'react'
import type { ExtractedMeeting } from '@/lib/rag'

export function useRAGExtract() {
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<ExtractedMeeting | null>(null)
    const [error, setError] = useState<string | null>(null)

    async function extract(transcript: string, department: string) {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch('/api/rag/extract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transcript, department }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setResult(data.extracted)
            return data.extracted as ExtractedMeeting
        } catch (e: any) {
            setError(e.message)
            return null
        } finally {
            setLoading(false)
        }
    }

    return { extract, loading, result, error }
}

export function useRAGSearch() {
    const [loading, setLoading] = useState(false)

    async function search(query: string, department: string, topK = 5) {
        setLoading(true)
        try {
            const params = new URLSearchParams({ query, department, topK: String(topK) })
            const res = await fetch(`/api/rag/retrieve?${params}`)
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            return data.results
        } finally {
            setLoading(false)
        }
    }

    return { search, loading }
}
