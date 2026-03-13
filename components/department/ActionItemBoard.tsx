'use client'

import { motion } from 'framer-motion'
import { ActionItem, Status } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { staggerContainer, staggerItem } from '@/lib/animations'

interface ActionItemBoardProps {
  items: ActionItem[]
  onSelectItem?: (item: ActionItem) => void
}

const statusOrder: Status[] = ['Backlog', 'In Progress', 'In Review', 'Done']

const statusConfig: Record<Status, { label: string; color: string; bgColor: string }> = {
  Backlog: { label: 'Backlog', color: 'text-muted-foreground', bgColor: 'bg-secondary/30' },
  'In Progress': { label: 'In Progress', color: 'text-status-amber', bgColor: 'bg-status-amber/10' },
  'In Review': { label: 'In Review', color: 'text-accent', bgColor: 'bg-accent/10' },
  Done: { label: 'Done', color: 'text-status-green', bgColor: 'bg-status-green/10' },
}

export function ActionItemBoard({ items, onSelectItem }: ActionItemBoardProps) {
  const columns = statusOrder.map(status => ({
    status,
    items: items.filter(item => item.status === status),
  }))

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 h-full">
      {columns.map(column => (
        <motion.div
          key={column.status}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: statusOrder.indexOf(column.status) * 0.1 }}
          className="flex-shrink-0 w-80"
        >
          {/* Column Header */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-foreground">{column.status}</h3>
              <span className="text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground">
                {column.items.length}
              </span>
            </div>
            <div className="h-1 bg-gradient-to-r from-border to-transparent rounded-full" />
          </div>

          {/* Cards */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-3"
          >
            {column.items.map(item => (
              <motion.div
                key={item.id}
                variants={staggerItem}
                onClick={() => onSelectItem?.(item)}
                className="group cursor-pointer"
              >
                <Card className={`p-4 border-l-4 border-border hover:border-accent transition-colors ${statusConfig[column.status].bgColor} hover:bg-opacity-80`}>
                  {/* Title */}
                  <h4 className="font-medium text-foreground text-sm mb-2 line-clamp-2 group-hover:text-accent transition-colors">
                    {item.title}
                  </h4>

                  {/* Meta */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    {/* Priority */}
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${
                      item.priority === 'P1'
                        ? 'bg-status-red/20 text-status-red'
                        : item.priority === 'P2'
                          ? 'bg-status-amber/20 text-status-amber'
                          : 'bg-secondary text-muted-foreground'
                    }`}>
                      {item.priority}
                    </span>

                    {/* Owner avatar */}
                    <div
                      className="w-6 h-6 rounded-full bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center text-xs font-bold text-accent-foreground"
                      title={item.owner.name}
                    >
                      {item.owner.avatar || item.owner.name.charAt(0)}
                    </div>
                  </div>

                  {/* Due date */}
                  <div className="text-xs text-muted-foreground">
                    Due {new Date(item.dueDate).toLocaleDateString()}
                  </div>

                  {/* Jira link */}
                  {item.linkedJiraKey && (
                    <div className="mt-2 text-xs">
                      <span className="text-muted-foreground">Jira: </span>
                      <span className="text-accent font-mono">{item.linkedJiraKey}</span>
                    </div>
                  )}
                </Card>
              </motion.div>
            ))}

            {column.items.length === 0 && (
              <div className="p-8 text-center text-muted-foreground text-sm rounded-lg border border-dashed border-border">
                No items
              </div>
            )}
          </motion.div>
        </motion.div>
      ))}
    </div>
  )
}
