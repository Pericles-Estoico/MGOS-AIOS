import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-mock';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Time Logs - Digital TaskOps',
};

export default async function TimeLogsPage() {
  const session = (await getServerSession(authOptions)) as unknown as Record<string, unknown> | null;

  // Restrict access to admin only
  const user = (session?.user as unknown as Record<string, unknown>) || {};
  if (user.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Time Logs Report</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Team Time Tracking</h2>

        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 border border-gray-200 rounded-lg">
            <div>
              <p className="font-semibold text-gray-900">John Doe</p>
              <p className="text-sm text-gray-600">Task #123 - 4.5 hours</p>
            </div>
            <span className="text-gray-500">Feb 18, 2026</span>
          </div>

          <div className="flex justify-between items-center p-4 border border-gray-200 rounded-lg">
            <div>
              <p className="font-semibold text-gray-900">Jane Smith</p>
              <p className="text-sm text-gray-600">Task #125 - 3 hours</p>
            </div>
            <span className="text-gray-500">Feb 18, 2026</span>
          </div>
        </div>

        <p className="text-gray-600 mt-6 text-center">More time logs will appear here</p>
      </div>
    </div>
  );
}
