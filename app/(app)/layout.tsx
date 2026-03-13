'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

export default function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    const auth = localStorage.getItem('meridian_auth');
    if (!auth) {
      router.push('/');
    }
  }, [router]);

  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}
