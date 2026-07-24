'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Nav } from "@/components/shared/nav";
import { useAuthContext } from '@/lib/auth-context';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/sign-in');
  }, [loading, user, router]);

  if (loading || !user) return null;

  return (
    <div className="min-h-full flex-1 flex flex-col">
      <Nav />
      <main className="mx-auto w-full max-w-6xl flex-1 p-4 pb-20 sm:p-6 md:pb-6">{children}</main>
    </div>
  );
}
