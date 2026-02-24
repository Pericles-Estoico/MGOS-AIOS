import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DashboardShell from '@/components/layout/DashboardShell';
import type { Session } from 'next-auth';

export const metadata = {
  title: 'Dashboard - Digital TaskOps',
  description: 'Task management dashboard',
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Verify authentication server-side
  const session = (await getServerSession(authOptions)) as Session | null;

  if (!session || !session.user) {
    redirect('/login');
  }

  return <DashboardShell user={session.user}>{children}</DashboardShell>;
}
