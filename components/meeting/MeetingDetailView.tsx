'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Meeting, ActionItem } from '@/lib/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { OverviewTab } from './OverviewTab'
import { TranscriptTab } from './TranscriptTab'
import KnowledgeGraph from "@/components/KnowledgeGraph"
import { OutputsTab } from './OutputsTab'
import { fadeIn } from '@/lib/animations'
import { ArrowLeft, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'

interface MeetingDetailViewProps {
  meeting: Meeting
  onSelectActionItem?: (item: ActionItem) => void
}

export function MeetingDetailView({ meeting, onSelectActionItem }: MeetingDetailViewProps) {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <motion.main
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="flex-1 flex flex-col"
    >
      {/* Header */}
      <div className="px-6 py-6 border-b border-border">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-accent hover:text-accent/80 transition-colors text-sm mb-3"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to meetings
            </Link>
            <h1 className="text-3xl font-bold text-foreground mb-2">{meeting.title}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{format(new Date(meeting.date), 'MMM d, yyyy h:mm a')}</span>
              <span>•</span>
              <span>{Math.round(meeting.duration)} minutes</span>
              <span>•</span>
              <span>{meeting.participants.length} participants</span>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-card/50 rounded-lg p-3 border border-border">
            <div className="text-xs text-muted-foreground mb-1">Decisions</div>
            <div className="text-2xl font-bold text-accent">{meeting.decisions.length}</div>
          </div>
          <div className="bg-card/50 rounded-lg p-3 border border-border">
            <div className="text-xs text-muted-foreground mb-1">Action Items</div>
            <div className="text-2xl font-bold text-status-amber">{meeting.actionItems.length}</div>
          </div>
          <div className="bg-card/50 rounded-lg p-3 border border-border">
            <div className="text-xs text-muted-foreground mb-1">Risks</div>
            <div className="text-2xl font-bold text-status-red">{meeting.risks.length}</div>
          </div>
          <div className="bg-card/50 rounded-lg p-3 border border-border">
            <div className="text-xs text-muted-foreground mb-1">Transcript Segments</div>
            <div className="text-2xl font-bold text-foreground">{meeting.transcript.length}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="mb-6 bg-card border border-border">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transcript">Transcript</TabsTrigger>
            <TabsTrigger value="knowledge">Knowledge Graph</TabsTrigger>
            <TabsTrigger value="outputs">Outputs</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="flex-1 overflow-y-auto">
            <OverviewTab
              meeting={meeting}
              onSelectActionItem={onSelectActionItem}
            />
          </TabsContent>

          {/* Transcript Tab */}
          <TabsContent value="transcript" className="flex-1 overflow-hidden">
            <TranscriptTab meeting={meeting} />
          </TabsContent>

          {/* Knowledge Graph Tab */}
          <TabsContent value="knowledge" className="flex-1 pb-10">
            {/* @ts-ignore - meeting.department might not be in the strict type but exists in data */}
            <KnowledgeGraph department={(meeting as any).department || "engineering"} meetingId={meeting.id} height={550} />
          </TabsContent>

          {/* Outputs Tab */}
          <TabsContent value="outputs" className="flex-1 overflow-y-auto">
            <OutputsTab meeting={meeting} />
          </TabsContent>
        </Tabs>
      </div>
    </motion.main>
  )
}
