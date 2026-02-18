import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Team Dashboard - Digital TaskOps',
};

export default async function TeamPage() {
  const session = await getServerSession(authOptions);

  // Restrict access
  if (!session?.user?.role || !['admin', 'head'].includes(session.user.role)) {
    redirect('/dashboard');
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Team Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl font-bold text-blue-600">5</div>
          <p className="text-gray-600 mt-2">Team Members</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl font-bold text-green-600">23</div>
          <p className="text-gray-600 mt-2">Total Tasks</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Team Members</h2>
        <p className="text-gray-600">Coming soon - Team member management interface</p>
      </div>
    </div>
  );
}
