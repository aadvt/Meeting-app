'use client'

import { motion } from 'framer-motion'
import { Meeting, Decision, ActionItem, Risk } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { staggerContainer, staggerItem, fadeIn } from '@/lib/animations'
import { CheckCircle2, AlertCircle, TrendingUp, User } from 'lucide-react'

interface OverviewTabProps {
  meeting: Meeting
  onSelectActionItem?: (item: ActionItem) => void
}

export function OverviewTab({ meeting, onSelectActionItem }: OverviewTabProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-6"
    >
      {/* Decisions Column */}
      <motion.div variants={staggerItem} className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="w-5 h-5 text-accent" />
          <h3 className="font-bold text-lg text-foreground">
            Decisions
            <span className="ml-2 text-sm text-muted-foreground font-normal">
              ({meeting.decisions.length})
            </span>
          </h3>
        </div>

        {meeting.decisions.map((decision, idx) => (
          <Card
            key={decision.id}
            className="p-4 bg-card/50 hover:bg-card/80 transition-colors border-l-4 border-accent"
          >
            <h4 className="font-semibold text-foreground mb-2 text-sm">{decision.title}</h4>
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{decision.description}</p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <User className="w-3 h-3 text-muted-foreground" />
                <span className="text-muted-foreground">{decision.owner.name}</span>
              </div>
              <span
                className={`text-xs font-semibold px-2 py-1 rounded ${
                  decision.impact === 'high'
                    ? 'bg-status-red/20 text-status-red'
                    : decision.impact === 'medium'
                      ? 'bg-status-amber/20 text-status-amber'
                      : 'bg-status-green/20 text-status-green'
                }`}
              >
                {decision.impact}
              </span>
            </div>
          </Card>
        ))}

        {meeting.decisions.length === 0 && (
          <Card className="p-6 text-center text-muted-foreground text-sm bg-card/30">
            No decisions recorded
          </Card>
        )}
      </motion.div>

      {/* Action Items Column */}
      <motion.div variants={staggerItem} className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-status-amber" />
          <h3 className="font-bold text-lg text-foreground">
            Action Items
            <span className="ml-2 text-sm text-muted-foreground font-normal">
              ({meeting.actionItems.length})
            </span>
          </h3>
        </div>

        {meeting.actionItems.map((item, idx) => (
          <Card
            key={item.id}
            onClick={() => onSelectActionItem?.(item)}
            className="p-4 bg-card/50 hover:bg-card/80 transition-colors cursor-pointer border-l-4 border-status-amber"
          >
            <h4 className="font-semibold text-foreground mb-2 text-sm group-hover:text-accent">
              {item.title}
            </h4>

            <div className="flex flex-col gap-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-medium text-foreground">{item.status}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Priority:</span>
                <span
                  className={`font-semibold ${
                    item.priority === 'P1'
                      ? 'text-status-red'
                      : item.priority === 'P2'
                        ? 'text-status-amber'
                        : 'text-muted-foreground'
                  }`}
                >
                  {item.priority}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Owner:</span>
                <span className="text-foreground">{item.owner.name}</span>
              </div>
            </div>
          </Card>
        ))}

        {meeting.actionItems.length === 0 && (
          <Card className="p-6 text-center text-muted-foreground text-sm bg-card/30">
            No action items
          </Card>
        )}
      </motion.div>

      {/* Risks Column */}
      <motion.div variants={staggerItem} className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-5 h-5 text-status-red" />
          <h3 className="font-bold text-lg text-foreground">
            Risks
            <span className="ml-2 text-sm text-muted-foreground font-normal">
              ({meeting.risks.length})
            </span>
          </h3>
        </div>

        {meeting.risks.map((risk, idx) => (
          <Card
            key={risk.id}
            className="p-4 bg-card/50 hover:bg-card/80 transition-colors border-l-4 border-status-red"
          >
            <h4 className="font-semibold text-foreground mb-2 text-sm">{risk.title}</h4>
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{risk.description}</p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <User className="w-3 h-3 text-muted-foreground" />
                <span className="text-muted-foreground">{risk.owner.name}</span>
              </div>
              <span
                className={`text-xs font-semibold px-2 py-1 rounded ${
                  risk.severity === 'high'
                    ? 'bg-status-red/20 text-status-red'
                    : risk.severity === 'medium'
                      ? 'bg-status-amber/20 text-status-amber'
                      : 'bg-status-green/20 text-status-green'
                }`}
              >
                {risk.severity}
              </span>
            </div>
          </Card>
        ))}

        {meeting.risks.length === 0 && (
          <Card className="p-6 text-center text-muted-foreground text-sm bg-card/30">
            No risks identified
          </Card>
        )}
      </motion.div>
    </motion.div>
  )
}
