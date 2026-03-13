'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Search, FileText, CheckCircle2, AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { meetings, departments } from '@/lib/data/mockData'

interface SearchResult {
  id: string
  type: 'meeting' | 'department' | 'action' | 'decision'
  title: string
  description?: string
  url: string
}

export function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const results = useMemo(() => {
    if (!query.trim()) return []

    const searchTerm = query.toLowerCase()
    const found: SearchResult[] = []

    // Search meetings
    Object.entries(meetings).forEach(([id, meeting]) => {
      if (meeting.title.toLowerCase().includes(searchTerm)) {
        found.push({
          id: `meeting-${id}`,
          type: 'meeting',
          title: meeting.title,
          description: `${meeting.decisions.length} decisions • ${meeting.actionItems.length} actions`,
          url: `/meeting/${id}`,
        })
      }
    })

    // Search departments
    Object.entries(departments).forEach(([id, dept]) => {
      if (dept.name.toLowerCase().includes(searchTerm)) {
        found.push({
          id: `dept-${id}`,
          type: 'department',
          title: dept.name,
          description: `${dept.meetingCount} meetings • ${dept.openActionItems} open items`,
          url: `/department/${id}`,
        })
      }
    })

    // Search action items
    Object.values(meetings).forEach(meeting => {
      meeting.actionItems.forEach(item => {
        if (item.title.toLowerCase().includes(searchTerm)) {
          found.push({
            id: `action-${item.id}`,
            type: 'action',
            title: item.title,
            description: `${item.status} • ${item.priority}`,
            url: `/meeting/${meeting.id}`,
          })
        }
      })
    })

    return found.slice(0, 8)
  }, [query])

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'meeting':
        return <FileText className="w-4 h-4 text-accent" />
      case 'department':
        return <AlertCircle className="w-4 h-4 text-amber-400" />
      case 'action':
        return <CheckCircle2 className="w-4 h-4 text-green-400" />
      case 'decision':
        return <AlertCircle className="w-4 h-4 text-purple-400" />
    }
  }

  return (
    <div className="relative flex-1 max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search meetings, tickets, decisions..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          className="pl-10 bg-secondary text-foreground placeholder-muted-foreground border-0"
        />
      </div>

      {/* Results Dropdown */}
      {isOpen && results.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50"
        >
          <div className="max-h-96 overflow-y-auto">
            {results.map(result => (
              <Link key={result.id} href={result.url}>
                <motion.button
                  whileHover={{ backgroundColor: 'rgba(14, 165, 233, 0.1)' }}
                  className="w-full px-4 py-3 flex items-start gap-3 text-left hover:bg-accent/10 transition-colors border-b border-border last:border-0"
                  onClick={() => {
                    setQuery('')
                    setIsOpen(false)
                  }}
                >
                  {getIcon(result.type)}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-foreground truncate">
                      {result.title}
                    </div>
                    {result.description && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {result.description}
                      </div>
                    )}
                  </div>
                </motion.button>
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
