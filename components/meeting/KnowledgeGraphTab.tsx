'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Meeting, Decision, ActionItem, Risk } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { fadeIn, staggerContainer } from '@/lib/animations'
import { AlertCircle } from 'lucide-react'

interface KnowledgeGraphTabProps {
  meeting: Meeting
}

interface Node {
  id: string
  type: 'decision' | 'action' | 'risk'
  label: string
  x: number
  y: number
  data: Decision | ActionItem | Risk
}

interface Edge {
  source: string
  target: string
  type: string
}

export function KnowledgeGraphTab({ meeting }: KnowledgeGraphTabProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  // Generate nodes and edges
  const generateGraph = () => {
    const nodes: Node[] = []
    const edges: Edge[] = []

    // Add decision nodes
    meeting.decisions.forEach((dec, idx) => {
      nodes.push({
        id: `dec-${dec.id}`,
        type: 'decision',
        label: dec.title,
        x: 100 + (idx % 3) * 200,
        y: 100 + Math.floor(idx / 3) * 150,
        data: dec,
      })
    })

    // Add action item nodes
    meeting.actionItems.forEach((item, idx) => {
      nodes.push({
        id: `act-${item.id}`,
        type: 'action',
        label: item.title,
        x: 100 + (idx % 3) * 200,
        y: 250 + Math.floor(idx / 3) * 150,
        data: item,
      })
    })

    // Add risk nodes
    meeting.risks.forEach((risk, idx) => {
      nodes.push({
        id: `risk-${risk.id}`,
        type: 'risk',
        label: risk.title,
        x: 100 + (idx % 3) * 200,
        y: 400 + Math.floor(idx / 3) * 150,
        data: risk,
      })
    })

    // Create edges: decisions → actions, decisions → risks
    meeting.decisions.forEach(dec => {
      meeting.actionItems.forEach(item => {
        if (item.title.toLowerCase().includes(dec.title.toLowerCase().split(' ')[0])) {
          edges.push({
            source: `dec-${dec.id}`,
            target: `act-${item.id}`,
            type: 'creates',
          })
        }
      })

      meeting.risks.forEach(risk => {
        if (risk.title.toLowerCase().includes(dec.title.toLowerCase().split(' ')[0])) {
          edges.push({
            source: `dec-${dec.id}`,
            target: `risk-${risk.id}`,
            type: 'may-cause',
          })
        }
      })
    })

    return { nodes, edges }
  }

  const { nodes, edges } = generateGraph()
  const conflicts = meeting.conflicts || []

  const nodeTypeColor = (type: string) => {
    switch (type) {
      case 'decision':
        return 'from-accent to-accent/60'
      case 'action':
        return 'from-status-amber to-status-amber/60'
      case 'risk':
        return 'from-status-red to-status-red/60'
      default:
        return 'from-secondary to-secondary/60'
    }
  }

  const nodeTypeBg = (type: string) => {
    switch (type) {
      case 'decision':
        return 'bg-accent/20'
      case 'action':
        return 'bg-status-amber/20'
      case 'risk':
        return 'bg-status-red/20'
      default:
        return 'bg-secondary/20'
    }
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="flex flex-col gap-6 pb-6"
    >
      {/* Conflict Banner */}
      {conflicts.length > 0 && (
        <motion.div
          variants={fadeIn}
          className="p-4 rounded-lg bg-status-red/20 border border-status-red/50 flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-status-red flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-status-red">
              {conflicts.length} conflict{conflicts.length > 1 ? 's' : ''} detected
            </div>
            <p className="text-sm text-status-red/80 mt-1">
              {conflicts.map(c => c.description).join(', ')}
            </p>
          </div>
        </motion.div>
      )}

      {/* Graph Canvas */}
      <motion.div
        variants={fadeIn}
        className="relative w-full h-96 rounded-lg border border-border bg-card/50 p-4 overflow-auto"
      >
        <svg width="100%" height="100%" className="min-w-full">
          {/* Draw edges */}
          {edges.map((edge, idx) => {
            const source = nodes.find(n => n.id === edge.source)
            const target = nodes.find(n => n.id === edge.target)

            if (!source || !target) return null

            return (
              <line
                key={`edge-${idx}`}
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                stroke="rgb(160, 160, 160)"
                strokeWidth="2"
                opacity="0.4"
                strokeDasharray={edge.type === 'may-cause' ? '5,5' : '0'}
              />
            )
          })}

          {/* Draw nodes */}
          {nodes.map(node => (
            <g
              key={node.id}
              onClick={() => setSelectedNodeId(node.id)}
              style={{ cursor: 'pointer' }}
            >
              {/* Node circle */}
              <circle
                cx={node.x}
                cy={node.y}
                r={selectedNodeId === node.id ? 35 : 30}
                fill={`url(#gradient-${node.type})`}
                opacity={selectedNodeId === node.id ? 1 : 0.8}
                style={{
                  transition: 'r 0.2s, opacity 0.2s',
                }}
              />

              {/* Node label */}
              <text
                x={node.x}
                y={node.y + 35}
                textAnchor="middle"
                fill="white"
                fontSize="12"
                fontWeight="bold"
                textLength="50"
              >
                {node.label.substring(0, 20)}
              </text>
            </g>
          ))}

          {/* Define gradients */}
          <defs>
            <linearGradient id="gradient-decision" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
            <linearGradient id="gradient-action" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
            <linearGradient id="gradient-risk" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#dc2626" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>

      {/* Legend and Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Legend */}
        <Card className="p-4 bg-card/50 border-border">
          <h3 className="font-semibold text-foreground mb-3">Legend</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent to-accent/60" />
              <span className="text-sm text-muted-foreground">Decisions</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-status-amber to-status-amber/60" />
              <span className="text-sm text-muted-foreground">Action Items</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-status-red to-status-red/60" />
              <span className="text-sm text-muted-foreground">Risks</span>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <Card className="p-4 bg-card/50 border-border">
          <h3 className="font-semibold text-foreground mb-3">Statistics</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nodes:</span>
              <span className="font-medium text-foreground">{nodes.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Connections:</span>
              <span className="font-medium text-foreground">{edges.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Conflicts:</span>
              <span className={`font-medium ${conflicts.length > 0 ? 'text-status-red' : 'text-status-green'}`}>
                {conflicts.length}
              </span>
            </div>
          </div>
        </Card>

        {/* Selected Node Info */}
        {selectedNodeId && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-4 bg-card/50 border-border">
              <h3 className="font-semibold text-foreground mb-3">Selected</h3>
              {(() => {
                const node = nodes.find(n => n.id === selectedNodeId)
                if (!node) return null
                const data = node.data

                return (
                  <div className="space-y-2 text-sm">
                    <div>
                      <div className="text-muted-foreground text-xs">Type</div>
                      <div className="font-medium text-foreground capitalize">{node.type}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">Title</div>
                      <div className="font-medium text-foreground line-clamp-2">{node.label}</div>
                    </div>
                    {'owner' in data && (
                      <div>
                        <div className="text-muted-foreground text-xs">Owner</div>
                        <div className="font-medium text-foreground">{(data as any).owner.name}</div>
                      </div>
                    )}
                  </div>
                )
              })()}
            </Card>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
