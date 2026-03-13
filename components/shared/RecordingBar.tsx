'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Pause, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface RecordingBarProps {
  isRecording: boolean
  onStop?: () => void
}

export function RecordingBar({ isRecording, onStop }: RecordingBarProps) {
  const [elapsedTime, setElapsedTime] = useState(0)

  useEffect(() => {
    if (!isRecording) return

    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [isRecording])

  if (!isRecording) return null

  const minutes = Math.floor(elapsedTime / 60)
  const seconds = elapsedTime % 60

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-card to-card/80 border-t border-border backdrop-blur-md"
    >
      <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-4">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="w-3 h-3 rounded-full bg-status-red"
          />
          <div className="text-sm font-medium text-foreground">
            Recording Meeting
            <span className="ml-2 text-muted-foreground font-mono">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Pause className="w-4 h-4" />
            Pause
          </Button>
          <Button
            onClick={onStop}
            variant="destructive"
            size="sm"
            className="gap-2 bg-status-red hover:bg-status-red/90"
          >
            <Square className="w-4 h-4" />
            Stop
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
