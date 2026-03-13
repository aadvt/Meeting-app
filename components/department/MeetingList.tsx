'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Meeting } from '@/lib/types'
import { formatDistanceToNow, format } from 'date-fns'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { staggerContainer, staggerItem } from '@/lib/animations'

interface MeetingListProps {
  meetings: Meeting[]
}

export function MeetingList({ meetings }: MeetingListProps) {
  const sortedMeetings = [...meetings].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const getStatusColor = (hasUnresolved: boolean, hasConflicts: boolean) => {
    if (hasConflicts) return 'border-l-status-red'
    if (hasUnresolved) return 'border-l-status-amber'
    return 'border-l-border'
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="flex flex-col gap-2 h-full overflow-y-auto pr-2"
    >
      {sortedMeetings.map(meeting => {
        const unresolvedItems = meeting.actionItems.filter(
          ai => ai.status !== 'Done'
        ).length
        const hasConflicts = meeting.conflicts && meeting.conflicts.length > 0

        return (
          <Link key={meeting.id} href={`/meeting/${meeting.id}`}>
            <motion.div
              variants={staggerItem}
              className={`group relative p-4 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors cursor-pointer border-l-4 ${getStatusColor(unresolvedItems > 0, hasConflicts)}`}
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground truncate group-hover:text-accent transition-colors">
                    {meeting.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(meeting.date), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>

                {/* Indicators */}
                <div className="flex gap-1 flex-shrink-0">
                  {hasConflicts && (
                    <div
                      className="w-2 h-2 rounded-full bg-status-red flex-shrink-0"
                      title="Conflicts detected"
                    />
                  )}
                  {unresolvedItems > 0 && (
                    <div
                      className="w-2 h-2 rounded-full bg-status-amber flex-shrink-0"
                      title="Unresolved items"
                    />
                  )}
                </div>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{meeting.decisions.length} decisions</span>
                <span>•</span>
                <span>{meeting.actionItems.length} actions</span>
                <span>•</span>
                <span>{meeting.risks.length} risks</span>
              </div>

              {/* Unresolved items badge */}
              {unresolvedItems > 0 && (
                <div className="mt-2 text-xs font-medium text-status-amber">
                  {unresolvedItems} unresolved item{unresolvedItems > 1 ? 's' : ''}
                </div>
              )}
            </motion.div>
          </Link>
        )
      })}

      {sortedMeetings.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <p className="text-muted-foreground">No meetings yet</p>
        </div>
      )}
    </motion.div>
  )
}
