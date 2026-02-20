import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-mock';
import { redirect } from 'next/navigation';
import DashboardShell from '@/components/layout/DashboardShell';

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
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return <DashboardShell user={session.user}>{children}</DashboardShell>;
}
