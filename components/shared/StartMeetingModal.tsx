'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Department } from '@/lib/types'
import { departments } from '@/lib/data/mockData'
import { Mic, Zap } from 'lucide-react'

interface StartMeetingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onStart: (title: string, departmentId: string) => void
}

export function StartMeetingModal({
  open,
  onOpenChange,
  onStart,
}: StartMeetingModalProps) {
  const [title, setTitle] = useState('')
  const [departmentId, setDepartmentId] = useState(Object.keys(departments)[0])
  const [isRecording, setIsRecording] = useState(false)

  const handleStart = () => {
    if (title.trim()) {
      onStart(title, departmentId)
      setTitle('')
      setIsRecording(true)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="w-5 h-5 text-accent" />
            Start Meeting
          </DialogTitle>
          <DialogDescription>
            Begin recording and capture meeting intelligence
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Meeting Title */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Meeting Title
            </label>
            <Input
              placeholder="e.g., Q2 Planning Session"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleStart()}
              autoFocus
            />
          </div>

          {/* Department */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Department
            </label>
            <Select value={departmentId} onValueChange={setDepartmentId}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(departments).map(dept => (
                  <SelectItem key={dept.id} value={dept.id}>
                    <div className="flex items-center gap-2">
                      <span>{dept.icon}</span>
                      <span>{dept.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Recording Mode Info */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-lg bg-accent/10 border border-accent/20"
          >
            <div className="flex items-start gap-2">
              <Zap className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
              <div className="text-sm text-foreground">
                <div className="font-medium mb-1">Live Recording</div>
                <p className="text-xs text-muted-foreground">
                  Meridian will capture decisions, action items, and risks in real-time
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleStart}
            disabled={!title.trim()}
            className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
          >
            <Mic className="w-4 h-4" />
            Start Recording
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
