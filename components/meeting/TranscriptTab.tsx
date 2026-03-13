'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Meeting } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { staggerContainer, fadeIn } from '@/lib/animations'
import { Clock, LogOut } from 'lucide-react'

interface TranscriptTabProps {
  meeting: Meeting
}

export function TranscriptTab({ meeting }: TranscriptTabProps) {
  const [selectedHighlightId, setSelectedHighlightId] = useState<string | null>(null)
  const [highlightIndex, setHighlightIndex] = useState(0)
  const highlightsRef = useRef<HTMLDivElement>(null)

  // Collect all highlights from transcript
  const allHighlights = meeting.transcript
    .filter(seg => seg.highlights && seg.highlights.length > 0)
    .map((seg, idx) => ({
      id: `${seg.id}-highlights`,
      segmentId: seg.id,
      text: seg.text,
      speaker: seg.speaker.name,
      timestamp: seg.timestamp,
      highlights: seg.highlights,
      order: idx,
    }))

  useEffect(() => {
    if (selectedHighlightId && highlightsRef.current) {
      const element = document.getElementById(`highlight-${selectedHighlightId}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }, [selectedHighlightId])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${String(secs).padStart(2, '0')}`
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-6 h-[calc(100vh-300px)]"
    >
      {/* Transcript */}
      <motion.div
        variants={fadeIn}
        className="lg:col-span-2 overflow-y-auto pr-4 space-y-3"
      >
        {meeting.transcript.map((segment, idx) => (
          <Card
            key={segment.id}
            className={`p-4 bg-card/50 border transition-colors cursor-pointer ${
              selectedHighlightId === segment.id
                ? 'border-accent bg-accent/10'
                : 'border-border hover:border-accent/50'
            }`}
            onClick={() => setSelectedHighlightId(segment.id)}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <div className="font-semibold text-foreground">{segment.speaker.name}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Clock className="w-3 h-3" />
                  {formatTime(segment.timestamp)}
                </div>
              </div>
              {segment.highlights && segment.highlights.length > 0 && (
                <span className="text-xs px-2 py-1 rounded-full bg-accent/20 text-accent font-medium">
                  {segment.highlights.length} highlight{segment.highlights.length > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Text */}
            <p className="text-sm text-foreground leading-relaxed">{segment.text}</p>
          </Card>
        ))}
      </motion.div>

      {/* Highlights Panel */}
      <motion.div
        variants={fadeIn}
        className="flex flex-col gap-3 bg-card/50 rounded-lg border border-border p-4 h-full overflow-hidden"
      >
        <div>
          <h3 className="font-bold text-foreground mb-1">Highlights</h3>
          <p className="text-xs text-muted-foreground">
            {allHighlights.length} section{allHighlights.length !== 1 ? 's' : ''} with key items
          </p>
        </div>

        {/* Highlights List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-2" ref={highlightsRef}>
          <AnimatePresence>
            {allHighlights.length > 0 ? (
              allHighlights.map((highlight, idx) => (
                <motion.div
                  key={highlight.id}
                  id={`highlight-${highlight.id}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  onClick={() => setSelectedHighlightId(highlight.segmentId)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedHighlightId === highlight.segmentId
                      ? 'bg-accent/20 border border-accent'
                      : 'bg-secondary/30 border border-border hover:border-accent/50'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-xs text-foreground mb-1">{highlight.speaker}</div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {highlight.text}
                      </p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {formatTime(highlight.timestamp)}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="p-4 text-center text-muted-foreground text-sm">
                No highlights in transcript
              </div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  )
}
