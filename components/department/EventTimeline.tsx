'use client';

import { motion } from 'framer-motion';
import {
  Play,
  CheckCircle2,
  AlertCircle,
  Users,
  Clock,
  Zap,
} from 'lucide-react';
import { TimelineEvent } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

interface EventTimelineProps {
  events: TimelineEvent[];
}

export function EventTimeline({ events }: EventTimelineProps) {
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'meeting_started':
        return <Play className="w-4 h-4" />;
      case 'decision_made':
        return <Zap className="w-4 h-4" />;
      case 'action_created':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'risk_flagged':
        return <AlertCircle className="w-4 h-4" />;
      case 'participant_joined':
      case 'participant_left':
        return <Users className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'decision_made':
        return 'from-cyan-400 to-blue-500';
      case 'action_created':
        return 'from-green-400 to-emerald-500';
      case 'risk_flagged':
        return 'from-red-400 to-rose-500';
      case 'meeting_started':
        return 'from-purple-400 to-violet-500';
      default:
        return 'from-white/30 to-white/20';
    }
  };

  const getEventBgColor = (type: string) => {
    switch (type) {
      case 'decision_made':
        return 'bg-cyan-500/20';
      case 'action_created':
        return 'bg-green-500/20';
      case 'risk_flagged':
        return 'bg-red-500/20';
      case 'meeting_started':
        return 'bg-purple-500/20';
      default:
        return 'bg-white/5';
    }
  };

  return (
    <div className="space-y-4">
      {events.map((event, index) => (
        <motion.div
          key={`${event.id}-${index}`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05, duration: 0.3 }}
          className="relative"
        >
          {/* Timeline connector */}
          {index < events.length - 1 && (
            <div className="absolute left-6 top-14 w-0.5 h-8 bg-gradient-to-b from-white/20 to-transparent" />
          )}

          {/* Event Card */}
          <div className="flex gap-4">
            {/* Timeline dot */}
            <div className="flex-shrink-0">
              <motion.div
                whileHover={{ scale: 1.2 }}
                className={`w-12 h-12 rounded-full bg-gradient-to-br ${getEventColor(
                  event.type
                )} flex items-center justify-center text-white border border-white/20 shadow-lg shadow-cyan-500/20`}
              >
                {getEventIcon(event.type)}
              </motion.div>
            </div>

            {/* Event Content */}
            <motion.div
              whileHover={{ x: 4 }}
              className={`glass-interactive flex-1 p-4 group cursor-pointer`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-white group-hover:text-cyan-300 transition-colors">
                    {event.title}
                  </h4>
                  <p className="text-xs text-white/50 mt-1">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                {event.severity && (
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-medium ${getEventBgColor(
                      event.severity
                    )} text-white/80`}
                  >
                    {event.severity}
                  </span>
                )}
              </div>

              <p className="text-sm text-white/70 mb-3">{event.description}</p>

              {/* Metadata badges */}
              {event.metadata && (
                <div className="flex flex-wrap gap-2">
                  {event.metadata.meetingId && (
                    <span className="inline-block px-2 py-1 rounded text-xs bg-white/10 text-white/60">
                      Meeting
                    </span>
                  )}
                  {event.metadata.participantId && (
                    <span className="inline-block px-2 py-1 rounded text-xs bg-white/10 text-white/60">
                      Participant
                    </span>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
