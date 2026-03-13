'use client';

import CapturePanel from '@/components/CapturePanel';
import { GlassDashboard } from '@/components/dashboard/GlassDashboard';
import { company } from '@/lib/data/mockData';

export default function DashboardPage() {
  return (
    <>
      <div className="max-w-7xl mx-auto px-6 pt-6">
        <CapturePanel />
      </div>
      <GlassDashboard company={company} />
    </>
  );
}
