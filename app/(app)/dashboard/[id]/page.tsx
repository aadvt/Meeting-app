'use client';

import { DepartmentDetail } from '@/components/department/DepartmentDetail';
import { company } from '@/lib/data/mockData';
import { useParams } from 'next/navigation';

export default function DepartmentPage() {
  const params = useParams();
  const departmentId = params.id as string;

  const department = company.departments.find((d) => d.id === departmentId);

  if (!department) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Department not found</h1>
          <p className="text-white/60">The department you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  // Get meetings for this department
  const meetings = company.departments
    .find((d) => d.id === departmentId)
    ?.meetings || [];

  return (
    <DepartmentDetail department={department} meetings={meetings} />
  );
}
