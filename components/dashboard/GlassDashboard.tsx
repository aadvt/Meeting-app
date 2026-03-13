'use client';

import { motion } from 'framer-motion';
import { LogOut, Settings, Bell } from 'lucide-react';
import { Company } from '@/lib/types';
import { GlassDepartmentCard } from './GlassDepartmentCard';
import { useRouter } from 'next/navigation';

interface GlassDashboardProps {
  company: Company;
}

export function GlassDashboard({ company }: GlassDashboardProps) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('meridian_auth');
    router.push('/');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Top Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 glass-sm backdrop-blur-xl border-b border-white/10 px-6 py-4"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Meridian</h1>
            <p className="text-xs text-white/50 mt-1">Meeting Intelligence Platform</p>
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white">
              <Bell className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white">
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-red-500/20 transition-colors text-white/60 hover:text-red-400"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            <span className="gradient-text">{company.name}</span>
          </h2>
          <p className="text-white/60 text-lg">
            Manage departments and track meeting intelligence across your organization
          </p>
        </motion.div>

        {/* Departments Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {company.departments.map((dept, index) => (
            <GlassDepartmentCard
              key={dept.id}
              department={dept}
              index={index}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}
