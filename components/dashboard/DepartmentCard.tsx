'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Department } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { expandCard, pulseAnimation } from '@/lib/animations'
import { formatDistanceToNow } from 'date-fns'

interface DepartmentCardProps {
  department: Department
  index?: number
}

export function DepartmentCard({ department, index = 0 }: DepartmentCardProps) {
  return (
    <Link href={`/department/${department.id}`}>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={expandCard}
        transition={{ delay: index * 0.05 }}
      >
        <Card className="group relative overflow-hidden cursor-pointer border-border bg-card hover:bg-card/80 transition-colors h-full">
          {/* Background pulse effect */}
          {department.isRecording && (
            <motion.div
              animate={pulseAnimation}
              className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent opacity-0 group-hover:opacity-100"
            />
          )}

          <div className="relative p-6 flex flex-col h-full">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="text-3xl mb-2">{department.icon}</div>
                <h3 className="text-xl font-bold text-foreground mb-1">{department.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-1">{department.description}</p>
              </div>

              {/* Recording indicator */}
              {department.isRecording && (
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="flex-shrink-0 w-3 h-3 rounded-full bg-status-red mt-1"
                  title="Recording in progress"
                />
              )}
            </div>

            {/* Stats */}
            <div className="flex-1 grid grid-cols-2 gap-3 mb-4">
              <div className="bg-secondary/50 rounded-lg p-3">
                <div className="text-2xl font-bold text-accent">{department.openActionItems}</div>
                <div className="text-xs text-muted-foreground">Open Items</div>
              </div>
              <div className="bg-secondary/50 rounded-lg p-3">
                <div className="text-2xl font-bold text-accent">{department.meetingCount}</div>
                <div className="text-xs text-muted-foreground">Meetings</div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-border/50">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Last meeting</div>
                <div className="text-sm font-medium text-foreground">
                  {department.lastMeetingDate
                    ? formatDistanceToNow(new Date(department.lastMeetingDate), { addSuffix: true })
                    : 'Never'}
                </div>
              </div>
              <div className="text-xs px-2 py-1 rounded bg-accent/20 text-accent font-medium">
                View →
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </Link>
  )
}
