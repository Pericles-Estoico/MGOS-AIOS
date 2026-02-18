'use client';

interface StatusChange {
  id: string;
  operation: string;
  old_value?: { status?: string };
  new_value?: { status?: string };
  created_by?: string;
  created_at: string;
}

interface TaskStatusTimelineProps {
  statusHistory?: StatusChange[];
  loading?: boolean;
}

const operationLabels: Record<string, string> = {
  start_task: 'Task Started',
  submit_task: 'Evidence Submitted',
  qa_review: 'QA Review Started',
  approve_task: 'Task Approved',
  reject_task: 'Task Rejected',
  resubmit_task: 'Evidence Resubmitted',
};

export default function TaskStatusTimeline({ statusHistory = [], loading = false }: TaskStatusTimelineProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        <div className="animate-pulse bg-gray-200 h-12 rounded"></div>
        <div className="animate-pulse bg-gray-200 h-12 rounded"></div>
      </div>
    );
  }

  if (!statusHistory || statusHistory.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-sm">No status changes yet</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline vertical line */}
      <div className="absolute left-3 top-6 bottom-0 w-0.5 bg-gray-300"></div>

      {/* Timeline items */}
      <div className="space-y-6 pl-12">
        {statusHistory.map((change, index) => {
          const statusTransition = `${change.old_value?.status || '?'} → ${change.new_value?.status || '?'}`;
          const label = operationLabels[change.operation] || change.operation;
          const timestamp = new Date(change.created_at).toLocaleString('pt-BR');

          return (
            <div key={change.id || index} className="relative">
              {/* Timeline dot */}
              <div className="absolute -left-7 mt-1 w-6 h-6 rounded-full bg-blue-600 border-4 border-white shadow-md"></div>

              {/* Timeline card */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">{label}</h4>
                    <p className="text-sm text-gray-600 mt-1">{statusTransition}</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                  <span>📅 {timestamp}</span>
                  {change.created_by && <span>👤 {change.created_by}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
