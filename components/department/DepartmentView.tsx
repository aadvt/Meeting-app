'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Department, Meeting, ActionItem } from '@/lib/types'
import { DepartmentIntelligence } from './DepartmentIntelligence'
import { MeetingList } from './MeetingList'
import { ActionItemBoard } from './ActionItemBoard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { fadeIn } from '@/lib/animations'

interface DepartmentViewProps {
  department: Department
  meetings: Meeting[]
}

export function DepartmentView({ department, meetings }: DepartmentViewProps) {
  const [selectedActionItem, setSelectedActionItem] = useState<ActionItem | null>(null)
  const [activeTab, setActiveTab] = useState('list')

  // Collect all action items from all meetings in this department
  const allActionItems = meetings.flatMap(m => m.actionItems)

  return (
    <motion.main
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="flex-1 flex flex-col"
    >
      {/* Department Header */}
      <div className="px-6 py-6 border-b border-border">
        <DepartmentIntelligence department={department} allActionItems={allActionItems} />
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-6 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="mb-6 bg-card border border-border">
            <TabsTrigger value="list">Meeting List</TabsTrigger>
            <TabsTrigger value="board">Action Items Board</TabsTrigger>
          </TabsList>

          {/* Meeting List Tab */}
          <TabsContent value="list" className="flex-1 overflow-hidden">
            <div className="h-full">
              <MeetingList meetings={meetings} />
            </div>
          </TabsContent>

          {/* Kanban Board Tab */}
          <TabsContent value="board" className="flex-1 overflow-hidden">
            <div className="h-full">
              <ActionItemBoard
                items={allActionItems}
                onSelectItem={setSelectedActionItem}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </motion.main>
  )
}
