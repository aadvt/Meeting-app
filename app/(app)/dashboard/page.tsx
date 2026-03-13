'use client';

import { GlassDashboard } from '@/components/dashboard/GlassDashboard';
import { company } from '@/lib/data/mockData';

export default function DashboardPage() {
  return <GlassDashboard company={company} />;
}
