'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ActionItem, Status } from '@/lib/types'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { slideOutRight, modalBackdrop } from '@/lib/animations'
import { X, Clock, ExternalLink, MessageSquare, Check } from 'lucide-react'

interface TicketSlideOverProps {
  item: ActionItem | null
  onClose: () => void
}

export function TicketSlideOver({ item, onClose }: TicketSlideOverProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(item?.title || '')
  const [status, setStatus] = useState<Status>(item?.status || 'Backlog')
  const [priority, setPriority] = useState(item?.priority || 'P2')

  if (!item) return null

  return (
    <AnimatePresence>
      {item && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={modalBackdrop}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-40"
          />

          {/* Slide-over Panel */}
          <motion.div
            variants={slideOutRight}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-card border-l border-border overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 flex items-center justify-between p-6 border-b border-border bg-card/50 backdrop-blur">
              <h2 className="text-lg font-bold text-foreground">Action Item</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
                  Title
                </label>
                <div
                  onClick={() => setIsEditing(true)}
                  className="text-xl font-bold text-foreground hover:text-accent transition-colors cursor-pointer"
                >
                  {title}
                </div>
                {isEditing && (
                  <Input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    onBlur={() => setIsEditing(false)}
                    autoFocus
                    className="mt-2"
                  />
                )}
              </div>

              {/* Status */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
                  Status
                </label>
                <Select value={status} onValueChange={value => setStatus(value as Status)}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Backlog">Backlog</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="In Review">In Review</SelectItem>
                    <SelectItem value="Done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
                  Priority
                </label>
                <div className="flex gap-2">
                  {(['P1', 'P2', 'P3'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setPriority(p)}
                      className={`px-3 py-2 rounded font-semibold text-sm transition-colors ${
                        priority === p
                          ? p === 'P1'
                            ? 'bg-status-red text-white'
                            : p === 'P2'
                              ? 'bg-status-amber text-white'
                              : 'bg-accent text-accent-foreground'
                          : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Owner */}
              <div className="p-4 rounded-lg bg-secondary/30 border border-border">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
                  Owner
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center">
                    {item.owner.avatar}
                  </div>
                  <div>
                    <div className="font-medium text-foreground text-sm">{item.owner.name}</div>
                    <div className="text-xs text-muted-foreground">{item.owner.email}</div>
                  </div>
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Due Date
                </label>
                <div className="text-foreground">
                  {new Date(item.dueDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
                  Description
                </label>
                <p className="text-foreground text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Source Block */}
              <Card className="p-4 bg-secondary/30 border-border">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  From Meeting
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="text-foreground font-medium">{item.sourceTranscriptId}</div>
                  <div className="text-muted-foreground text-xs">
                    This item was extracted from the meeting transcript
                  </div>
                </div>
              </Card>

              {/* Jira Link */}
              {item.linkedJiraKey && (
                <Card className="p-4 bg-secondary/30 border-border">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Jira Issue
                    </h4>
                    <span
                      className={`text-xs px-2 py-1 rounded font-medium ${
                        item.jiraStatus === 'Done'
                          ? 'bg-status-green/20 text-status-green'
                          : 'bg-status-amber/20 text-status-amber'
                      }`}
                    >
                      {item.jiraStatus}
                    </span>
                  </div>
                  <div className="font-mono text-accent">{item.linkedJiraKey}</div>
                </Card>
              )}

              {/* Comments Section */}
              <Card className="p-4 bg-secondary/30 border-border">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Comments
                  </h4>
                </div>
                <div className="space-y-3">
                  {item.comments.map((comment, idx) => (
                    <div key={idx} className="pb-3 border-b border-border/50 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-foreground">{comment.author.name}</span>
                        <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">{comment.text}</p>
                    </div>
                  ))}
                  {item.comments.length === 0 && (
                    <p className="text-sm text-muted-foreground">No comments yet</p>
                  )}
                </div>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t border-border">
                {item.linkedJiraKey && (
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open in Jira
                  </Button>
                )}
                {status !== 'Done' && (
                  <Button
                    className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Mark Done
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
