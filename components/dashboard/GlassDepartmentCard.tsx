'use client';

import { motion } from 'framer-motion';
import { ChevronRight, TrendingUp } from 'lucide-react';
import { Department } from '@/lib/types';
import Link from 'next/link';

interface GlassDepartmentCardProps {
  department: Department;
  index?: number;
}

export function GlassDepartmentCard({
  department,
  index = 0,
}: GlassDepartmentCardProps) {
  const meetingCount = department.meetings?.length || 0;
  const actionItemCount = department.meetings?.reduce(
    (sum, m) => sum + (m.actionItems?.length || 0),
    0
  ) || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ y: -5 }}
    >
      <Link href={`/dashboard/${department.id}`}>
        <div className="glass-interactive group h-full p-6 flex flex-col">
          {/* Header with icon and name */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-white mb-1">
                {department.name}
              </h3>
              <p className="text-white/60 text-sm">{department.description}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-cyan-400/0 group-hover:text-cyan-400 transition-all duration-300" />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6 flex-1">
            <div className="p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
              <p className="text-white/60 text-xs font-medium mb-1">Meetings</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-cyan-300">{meetingCount}</p>
                <TrendingUp className="w-4 h-4 text-cyan-400/50" />
              </div>
            </div>
            <div className="p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
              <p className="text-white/60 text-xs font-medium mb-1">Action Items</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-purple-300">{actionItemCount}</p>
              </div>
            </div>
          </div>

          {/* Team Members */}
          <div className="flex items-center gap-1 mt-auto">
            <p className="text-xs text-white/60">Team:</p>
            <div className="flex -space-x-2">
              {department.members?.slice(0, 3).map((member, i) => (
                <div
                  key={i}
                  className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 border border-white/10 flex items-center justify-center text-xs font-bold text-white"
                  title={member}
                >
                  {member.charAt(0)}
                </div>
              ))}
              {(department.members?.length || 0) > 3 && (
                <div className="w-6 h-6 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-xs font-bold text-white/60">
                  +{(department.members?.length || 0) - 3}
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
