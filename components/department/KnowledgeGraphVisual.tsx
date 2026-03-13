'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Meeting } from '@/lib/types';

interface GraphNode {
  id: string;
  label: string;
  type: 'decision' | 'action' | 'risk' | 'participant' | 'topic';
  x: number;
  y: number;
  radius: number;
  color: string;
}

interface GraphEdge {
  source: string;
  target: string;
  label: string;
  animated?: boolean;
}

interface KnowledgeGraphVisualProps {
  meeting: Meeting;
  isAnalyzing?: boolean;
}

export function KnowledgeGraphVisual({
  meeting,
  isAnalyzing = true,
}: KnowledgeGraphVisualProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Generate graph data from meeting
  useEffect(() => {
    const newNodes: GraphNode[] = [];
    const newEdges: GraphEdge[] = [];

    // Add participants
    meeting.participants.forEach((participant, i) => {
      const angle = (i / meeting.participants.length) * Math.PI * 2;
      newNodes.push({
        id: `participant-${participant.id}`,
        label: participant.name,
        type: 'participant',
        x: Math.cos(angle) * 150 + 300,
        y: Math.sin(angle) * 150 + 300,
        radius: 24,
        color: '#8b5cf6',
      });
    });

    // Add decisions
    meeting.decisions.forEach((decision, i) => {
      const angle = (i / (meeting.decisions.length || 1)) * Math.PI * 2 + Math.PI / 4;
      newNodes.push({
        id: `decision-${decision.id}`,
        label: decision.title.substring(0, 20),
        type: 'decision',
        x: Math.cos(angle) * 200 + 300,
        y: Math.sin(angle) * 200 + 300,
        radius: 28,
        color: '#0ea5e9',
      });

      // Edge from owner to decision
      newEdges.push({
        source: `participant-${decision.owner.id}`,
        target: `decision-${decision.id}`,
        label: 'decided',
      });
    });

    // Add action items
    meeting.actionItems.forEach((action, i) => {
      const angle = (i / (meeting.actionItems.length || 1)) * Math.PI * 2 + Math.PI / 2;
      newNodes.push({
        id: `action-${action.id}`,
        label: action.title.substring(0, 20),
        type: 'action',
        x: Math.cos(angle) * 180 + 300,
        y: Math.sin(angle) * 180 + 300,
        radius: 26,
        color: '#10b981',
      });

      // Edge from owner to action
      newEdges.push({
        source: `participant-${action.owner.id}`,
        target: `action-${action.id}`,
        label: 'owns',
      });
    });

    // Add risks
    meeting.risks.forEach((risk, i) => {
      const angle = (i / (meeting.risks.length || 1)) * Math.PI * 2 + Math.PI;
      newNodes.push({
        id: `risk-${risk.id}`,
        label: risk.title.substring(0, 20),
        type: 'risk',
        x: Math.cos(angle) * 170 + 300,
        y: Math.sin(angle) * 170 + 300,
        radius: 24,
        color: '#ef4444',
      });

      // Edge from owner to risk
      newEdges.push({
        source: `participant-${risk.owner.id}`,
        target: `risk-${risk.id}`,
        label: 'flagged',
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [meeting]);

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'participant':
        return '#8b5cf6';
      case 'decision':
        return '#0ea5e9';
      case 'action':
        return '#10b981';
      case 'risk':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const nodeVariants = {
    hidden: { opacity: 0, scale: 0 },
    visible: (custom: number) => ({
      opacity: 1,
      scale: 1,
      transition: {
        delay: custom * 0.05,
        duration: 0.4,
        ease: 'easeOut',
      },
    }),
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header with status */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-sm text-white/70">
            {isAnalyzing ? 'Analyzing transcript...' : 'Graph complete'}
          </span>
        </div>
      </div>

      {/* Graph SVG */}
      <div className="flex-1 overflow-hidden">
        <svg
          ref={svgRef}
          className="w-full h-full"
          viewBox="0 0 600 600"
          style={{ background: 'transparent' }}
        >
          {/* Edges */}
          {edges.map((edge, idx) => {
            const sourceNode = nodes.find((n) => n.id === edge.source);
            const targetNode = nodes.find((n) => n.id === edge.target);

            if (!sourceNode || !targetNode) return null;

            return (
              <motion.g key={edge.source + edge.target}>
                <motion.line
                  x1={sourceNode.x}
                  y1={sourceNode.y}
                  x2={targetNode.x}
                  y2={targetNode.y}
                  stroke="white"
                  strokeWidth="1"
                  opacity="0.2"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.2 }}
                  transition={{
                    delay: idx * 0.08,
                    duration: 0.6,
                  }}
                />

                {/* Edge label */}
                <motion.text
                  x={(sourceNode.x + targetNode.x) / 2}
                  y={(sourceNode.y + targetNode.y) / 2 - 5}
                  textAnchor="middle"
                  fontSize="10"
                  fill="white"
                  opacity="0.5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  transition={{ delay: idx * 0.08 + 0.3, duration: 0.3 }}
                >
                  {edge.label}
                </motion.text>
              </motion.g>
            );
          })}

          {/* Nodes */}
          {nodes.map((node, idx) => (
            <motion.g
              key={node.id}
              custom={idx}
              variants={nodeVariants}
              initial="hidden"
              animate="visible"
              onHoverStart={() => setHoveredNode(node.id)}
              onHoverEnd={() => setHoveredNode(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Glow effect */}
              {hoveredNode === node.id && (
                <motion.circle
                  cx={node.x}
                  cy={node.y}
                  r={node.radius + 8}
                  fill={node.color}
                  opacity="0.2"
                  animate={{ r: node.radius + 15 }}
                  transition={{ duration: 0.3 }}
                />
              )}

              {/* Node circle */}
              <motion.circle
                cx={node.x}
                cy={node.y}
                r={node.radius}
                fill={node.color}
                stroke="white"
                strokeWidth="2"
                opacity={hoveredNode && hoveredNode !== node.id ? 0.3 : 0.8}
                whileHover={{ r: node.radius + 4 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />

              {/* Node label */}
              <motion.text
                x={node.x}
                y={node.y}
                textAnchor="middle"
                dy="0.3em"
                fontSize="11"
                fontWeight="600"
                fill="white"
                pointerEvents="none"
                opacity={hoveredNode && hoveredNode !== node.id ? 0.3 : 1}
              >
                {node.label}
              </motion.text>

              {/* Tooltip on hover */}
              {hoveredNode === node.id && (
                <motion.g
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <rect
                    x={node.x + 10}
                    y={node.y - 30}
                    width="120"
                    height="40"
                    rx="6"
                    fill="rgba(0, 0, 0, 0.8)"
                    stroke="white"
                    strokeWidth="1"
                    opacity="0.9"
                  />
                  <text
                    x={node.x + 60}
                    y={node.y - 10}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="600"
                    fill="white"
                  >
                    {node.type}
                  </text>
                </motion.g>
              )}
            </motion.g>
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="border-t border-white/10 px-6 py-4 bg-white/5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-400" />
            <span className="text-white/70">Participants</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-cyan-400" />
            <span className="text-white/70">Decisions</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-400" />
            <span className="text-white/70">Actions</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <span className="text-white/70">Risks</span>
          </div>
        </div>
      </div>
    </div>
  );
}
