'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Filter } from 'lucide-react';
import Link from 'next/link';
import { Department, Meeting, TimelineEvent } from '@/lib/types';
import { EventTimeline } from './EventTimeline';
import { KnowledgeGraphVisual } from './KnowledgeGraphVisual';

interface DepartmentDetailProps {
  department: Department;
  meetings: Meeting[];
}

export function DepartmentDetail({
  department,
  meetings,
}: DepartmentDetailProps) {
  const [activeTab, setActiveTab] = useState<'timeline' | 'graph'>('timeline');
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(
    meetings[0] || null
  );

  // Generate timeline events
  const timelineEvents = useMemo(() => {
    const events: TimelineEvent[] = [];

    meetings.forEach((meeting) => {
      // Meeting started
      events.push({
        id: `${meeting.id}-start`,
        type: 'meeting_started',
        title: meeting.title,
        description: `Meeting started with ${meeting.participants.length} participants`,
        timestamp: meeting.date,
        metadata: { meetingId: meeting.id },
      });

      // Decisions made
      meeting.decisions.forEach((decision) => {
        events.push({
          id: decision.id,
          type: 'decision_made',
          title: `Decision: ${decision.title}`,
          description: decision.description,
          timestamp: meeting.date,
          metadata: { meetingId: meeting.id, decisionId: decision.id },
          severity: decision.impact === 'high' ? 'high' : 'medium',
        });
      });

      // Actions created
      meeting.actionItems.forEach((action) => {
        events.push({
          id: action.id,
          type: 'action_created',
          title: `Action: ${action.title}`,
          description: action.description,
          timestamp: meeting.date,
          metadata: { meetingId: meeting.id, actionItemId: action.id },
          severity: action.priority === 'P1' ? 'high' : 'medium',
        });
      });

      // Risks flagged
      meeting.risks.forEach((risk) => {
        events.push({
          id: risk.id,
          type: 'risk_flagged',
          title: `Risk: ${risk.title}`,
          description: risk.description,
          timestamp: meeting.date,
          metadata: { meetingId: meeting.id, riskId: risk.id },
          severity: risk.severity,
        });
      });
    });

    return events.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [meetings]);

  return (
    <div className="min-h-screen pb-20">
      {/* Top Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 glass-sm backdrop-blur-xl border-b border-white/10 px-6 py-4"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">{department.name}</h1>
              <p className="text-xs text-white/50 mt-1">
                {meetings.length} meetings • {department.description}
              </p>
            </div>
          </div>

          <button className="glass-interactive px-4 py-2 flex items-center gap-2 text-sm text-white">
            <Plus className="w-4 h-4" />
            New Meeting
          </button>
        </div>
      </motion.nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Meeting Selector */}
        {meetings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h3 className="text-sm font-semibold text-white/70 mb-4">Recent Meetings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {meetings.map((meeting, idx) => (
                <motion.button
                  key={meeting.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => setSelectedMeeting(meeting)}
                  className={`glass-interactive text-left p-4 transition-all ${
                    selectedMeeting?.id === meeting.id
                      ? 'ring-2 ring-cyan-400 bg-cyan-400/10'
                      : ''
                  }`}
                >
                  <p className="font-semibold text-white text-sm mb-1">
                    {meeting.title.substring(0, 20)}
                  </p>
                  <p className="text-xs text-white/50">
                    {new Date(meeting.date).toLocaleDateString()}
                  </p>
                  <div className="flex gap-2 mt-3 text-xs">
                    <span className="px-2 py-1 rounded bg-cyan-400/20 text-cyan-300">
                      {meeting.decisions.length} decisions
                    </span>
                    <span className="px-2 py-1 rounded bg-green-400/20 text-green-300">
                      {meeting.actionItems.length} actions
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Content Area */}
        {selectedMeeting ? (
          <motion.div
            key={selectedMeeting.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid lg:grid-cols-2 gap-8"
          >
            {/* Timeline */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="glass-lg p-6">
                <h2 className="text-2xl font-bold text-white mb-6">Timeline</h2>
                <EventTimeline events={timelineEvents} />
              </div>
            </motion.div>

            {/* Knowledge Graph */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="glass-lg overflow-hidden rounded-2xl flex flex-col h-[600px]">
                <KnowledgeGraphVisual meeting={selectedMeeting} isAnalyzing={false} />
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-lg p-12 text-center"
          >
            <p className="text-white/60 mb-4">No meetings found for this department</p>
            <button className="glass-interactive px-6 py-2 inline-flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" />
              Create First Meeting
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
