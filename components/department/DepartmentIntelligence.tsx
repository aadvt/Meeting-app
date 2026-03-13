'use client'

import { motion } from 'framer-motion'
import { Department, ActionItem } from '@/lib/types'
import { staggerContainer, fadeIn } from '@/lib/animations'

interface DepartmentIntelligenceProps {
  department: Department
  allActionItems: ActionItem[]
}

export function DepartmentIntelligence({
  department,
  allActionItems,
}: DepartmentIntelligenceProps) {
  const stats = {
    total: allActionItems.length,
    backlog: allActionItems.filter(ai => ai.status === 'Backlog').length,
    inProgress: allActionItems.filter(ai => ai.status === 'In Progress').length,
    inReview: allActionItems.filter(ai => ai.status === 'In Review').length,
    done: allActionItems.filter(ai => ai.status === 'Done').length,
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="flex items-center gap-4 p-4 rounded-lg bg-gradient-to-r from-card to-card/50 border border-border"
    >
      {/* Department name */}
      <motion.div variants={fadeIn} className="flex items-center gap-3 min-w-0">
        <span className="text-2xl">{department.icon}</span>
        <div className="min-w-0">
          <h2 className="font-bold text-lg text-foreground truncate">{department.name}</h2>
          <p className="text-xs text-muted-foreground truncate">{department.description}</p>
        </div>
      </motion.div>

      {/* Divider */}
      <div className="h-12 w-px bg-border" />

      {/* Stats */}
      <motion.div variants={fadeIn} className="flex items-center gap-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-accent">{stats.total}</div>
          <div className="text-xs text-muted-foreground">Total</div>
        </div>

        <div className="h-12 w-px bg-border" />

        <div className="text-center">
          <div className="text-2xl font-bold text-muted-foreground">{stats.backlog}</div>
          <div className="text-xs text-muted-foreground">Backlog</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-status-amber">{stats.inProgress}</div>
          <div className="text-xs text-muted-foreground">In Progress</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-accent">{stats.inReview}</div>
          <div className="text-xs text-muted-foreground">In Review</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-status-green">{stats.done}</div>
          <div className="text-xs text-muted-foreground">Done</div>
        </div>
      </motion.div>
    </motion.div>
  )
}
