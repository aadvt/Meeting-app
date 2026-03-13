'use client'

import { motion } from 'framer-motion'
import { Company } from '@/lib/types'
import { DepartmentCard } from './DepartmentCard'
import { staggerContainer, fadeIn } from '@/lib/animations'

interface CompanyDashboardProps {
  company: Company
}

export function CompanyDashboard({ company }: CompanyDashboardProps) {
  return (
    <main className="flex-1">
      {/* Hero Section */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="px-6 py-8 mb-8"
      >
        <h1 className="text-4xl font-bold text-foreground mb-2">{company.name}</h1>
        <p className="text-lg text-muted-foreground">
          {company.departments.length} departments • {company.totalMeetings} meetings • {company.totalActionItems} action items
        </p>
      </motion.div>

      {/* Statistics Cards */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="px-6 mb-8 grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <motion.div
          variants={fadeIn}
          className="bg-card border border-border rounded-lg p-6"
        >
          <div className="text-sm text-muted-foreground mb-2">Total Meetings</div>
          <div className="text-3xl font-bold text-accent">{company.totalMeetings}</div>
        </motion.div>
        <motion.div
          variants={fadeIn}
          className="bg-card border border-border rounded-lg p-6"
        >
          <div className="text-sm text-muted-foreground mb-2">Action Items</div>
          <div className="text-3xl font-bold text-accent">{company.totalActionItems}</div>
        </motion.div>
        <motion.div
          variants={fadeIn}
          className="bg-card border border-border rounded-lg p-6"
        >
          <div className="text-sm text-muted-foreground mb-2">Last Activity</div>
          <div className="text-3xl font-bold text-accent">Now</div>
        </motion.div>
      </motion.div>

      {/* Department Grid */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="px-6 pb-8"
      >
        <h2 className="text-2xl font-bold text-foreground mb-4">Departments</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {company.departments.map((dept, idx) => (
            <DepartmentCard
              key={dept.id}
              department={dept}
              index={idx}
            />
          ))}
        </div>
      </motion.div>
    </main>
  )
}
