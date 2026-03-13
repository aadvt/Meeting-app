'use client'

import { motion } from 'framer-motion'
import { Meeting, Output } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { staggerContainer, staggerItem } from '@/lib/animations'
import { Check, Clock, AlertCircle, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface OutputsTabProps {
  meeting: Meeting
}

const outputConfig: Record<string, { icon: string; label: string; color: string }> = {
  jira: { icon: '⚙️', label: 'Jira', color: 'text-blue-400' },
  gmail: { icon: '📧', label: 'Gmail', color: 'text-red-400' },
  slack: { icon: '💬', label: 'Slack', color: 'text-purple-400' },
  calendar: { icon: '📅', label: 'Calendar', color: 'text-green-400' },
}

export function OutputsTab({ meeting }: OutputsTabProps) {
  const statusIcon = (status: Output['status']) => {
    switch (status) {
      case 'synced':
        return <Check className="w-4 h-4 text-status-green" />
      case 'pending':
        return <Clock className="w-4 h-4 text-status-amber" />
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-status-red" />
    }
  }

  const statusLabel = (status: Output['status']) => {
    switch (status) {
      case 'synced':
        return 'Synced'
      case 'pending':
        return 'Pending'
      case 'failed':
        return 'Failed'
    }
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6"
    >
      {meeting.outputs.map((output, idx) => {
        const config = outputConfig[output.type]

        return (
          <motion.div key={output.id} variants={staggerItem}>
            <Card className={`p-6 border-l-4 transition-colors ${
              output.status === 'synced'
                ? 'border-status-green bg-status-green/5 hover:bg-status-green/10'
                : output.status === 'pending'
                  ? 'border-status-amber bg-status-amber/5 hover:bg-status-amber/10'
                  : 'border-status-red bg-status-red/5 hover:bg-status-red/10'
            }`}>
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{config.icon}</span>
                  <div>
                    <h3 className="font-bold text-foreground">{config.label}</h3>
                    <p className="text-sm text-muted-foreground">{output.description}</p>
                  </div>
                </div>

                {/* Status badge */}
                <div className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-card">
                  {statusIcon(output.status)}
                  <span className={
                    output.status === 'synced'
                      ? 'text-status-green'
                      : output.status === 'pending'
                        ? 'text-status-amber'
                        : 'text-status-red'
                  }>
                    {statusLabel(output.status)}
                  </span>
                </div>
              </div>

              {/* Metadata */}
              {output.syncedAt && (
                <div className="text-xs text-muted-foreground mb-4">
                  Last synced: {new Date(output.syncedAt).toLocaleTimeString()}
                </div>
              )}

              {/* Linked items */}
              {output.linkedItems && output.linkedItems.length > 0 && (
                <div className="mb-4 p-3 rounded-lg bg-secondary/30 border border-border">
                  <div className="text-xs font-medium text-foreground mb-2">
                    Linked items ({output.linkedItems.length})
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    {output.linkedItems.slice(0, 3).map(id => (
                      <div key={id} className="font-mono">• {id}</div>
                    ))}
                    {output.linkedItems.length > 3 && (
                      <div className="font-mono">+ {output.linkedItems.length - 3} more</div>
                    )}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2">
                {output.link && (
                  <Link href={output.link} target="_blank" className="w-full">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open in {config.label}
                    </Button>
                  </Link>
                )}
                {output.status === 'pending' && (
                  <Button
                    size="sm"
                    className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
                  >
                    Sync Now
                  </Button>
                )}
                {output.status === 'failed' && (
                  <Button
                    size="sm"
                    className="flex-1 bg-status-red hover:bg-status-red/90 text-white"
                  >
                    Retry
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>
        )
      })}

      {meeting.outputs.length === 0 && (
        <Card className="p-6 col-span-full text-center text-muted-foreground">
          No outputs configured for this meeting
        </Card>
      )}
    </motion.div>
  )
}
