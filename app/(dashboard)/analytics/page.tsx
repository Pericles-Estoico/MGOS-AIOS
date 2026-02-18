'use client';

import { useEffect, useState } from 'react';
import { getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface Summary {
  total_tasks: number;
  tasks_by_status: Record<string, number>;
  team_size: number;
  active_users: number;
  tasks_completed_today: number;
  avg_completion_time_hours: number;
  completion_rate_percent: number;
  burndown: {
    current_progress: number;
    expected_progress: number;
    days_remaining: number;
  };
}

interface TeamMember {
  user_id: string;
  name: string;
  tasks_assigned: number;
  tasks_completed: number;
  tasks_in_progress: number;
  completion_rate: number;
  avg_time_per_task_hours: number;
}

export default function AnalyticsDashboard() {
  const router = useRouter();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const session = await getSession();

      if (!session) {
        router.push('/login');
        return;
      }

      if (!session.user.role || !['admin', 'head'].includes(session.user.role)) {
        router.push('/dashboard');
        return;
      }

      await fetchAnalytics();
    };

    checkAuth();
  }, [router]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const [summaryRes, teamRes] = await Promise.all([
        fetch('/api/analytics/summary'),
        fetch('/api/analytics/team'),
      ]);

      if (!summaryRes.ok || !teamRes.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const summaryData = await summaryRes.json();
      const teamData = await teamRes.json();

      setSummary(summaryData.summary);
      setTeam(teamData.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 border border-red-200 rounded-lg bg-red-50">
        <p className="font-semibold text-red-600">Error loading analytics</p>
        <p className="text-sm text-red-500 mt-1">{error}</p>
      </div>
    );
  }

  if (!summary) {
    return <div>No data available</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-gray-600 mt-2">Team performance and project metrics</p>
      </div>

      {/* Metrics Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Tasks"
          value={summary.total_tasks}
          color="bg-blue"
        />
        <MetricCard
          title="Completed"
          value={summary.tasks_by_status.approved}
          color="bg-green"
        />
        <MetricCard
          title="In Progress"
          value={summary.tasks_by_status.in_progress}
          color="bg-yellow"
        />
        <MetricCard
          title="Pending"
          value={summary.tasks_by_status.pending}
          color="bg-gray"
        />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 border rounded-lg bg-white">
          <p className="text-gray-600 text-sm font-semibold">Completion Rate</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {summary.completion_rate_percent}%
          </p>
        </div>

        <div className="p-6 border rounded-lg bg-white">
          <p className="text-gray-600 text-sm font-semibold">Team Size</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {summary.team_size}
            <span className="text-sm text-gray-600 ml-2">
              ({summary.active_users} active)
            </span>
          </p>
        </div>

        <div className="p-6 border rounded-lg bg-white">
          <p className="text-gray-600 text-sm font-semibold">
            Avg. Completion Time
          </p>
          <p className="text-3xl font-bold text-purple-600 mt-2">
            {summary.avg_completion_time_hours}h
          </p>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="p-6 border rounded-lg bg-white">
        <h2 className="text-xl font-bold mb-4">Task Status Breakdown</h2>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {Object.entries(summary.tasks_by_status).map(([status, count]) => (
            <div key={status} className="text-center">
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-sm text-gray-600 capitalize">
                {status.replace('_', ' ')}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Team Performance */}
      <div className="border rounded-lg bg-white overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Team Performance</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                  Team Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                  Assigned
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                  Completed
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                  In Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                  Completion Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                  Avg Time/Task
                </th>
              </tr>
            </thead>
            <tbody>
              {team.map((member) => (
                <tr key={member.user_id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-3 text-sm font-medium text-gray-900">
                    {member.name}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600">
                    {member.tasks_assigned}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600">
                    {member.tasks_completed}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600">
                    {member.tasks_in_progress}
                  </td>
                  <td className="px-6 py-3 text-sm">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                      {member.completion_rate}%
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600">
                    {member.avg_time_per_task_hours}h
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: number;
  color?: string;
}

function MetricCard({ title, value }: MetricCardProps) {
  return (
    <div className="p-6 border rounded-lg bg-white">
      <p className="text-gray-600 text-sm font-semibold">{title}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}
