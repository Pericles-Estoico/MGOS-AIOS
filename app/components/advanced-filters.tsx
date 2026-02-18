'use client';

import { useState, useCallback } from 'react';

export interface FilterState {
  status?: string;
  priority?: string;
  executor?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  sprint?: string;
}

interface AdvancedFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  users?: Array<{ id: string; name: string }>;
  sprints?: Array<{ id: string; name: string }>;
}

export default function AdvancedFilters({
  filters,
  onFilterChange,
  users = [],
  sprints = [],
}: AdvancedFiltersProps) {
  const [collapsed, setCollapsed] = useState(false);

  const handleStatusChange = useCallback(
    (status: string) => {
      onFilterChange({ ...filters, status: status === 'all' ? undefined : status });
    },
    [filters, onFilterChange]
  );

  const handlePriorityChange = useCallback(
    (priority: string) => {
      onFilterChange({ ...filters, priority: priority === 'all' ? undefined : priority });
    },
    [filters, onFilterChange]
  );

  const handleExecutorChange = useCallback(
    (executor: string) => {
      onFilterChange({ ...filters, executor: executor === '' ? undefined : executor });
    },
    [filters, onFilterChange]
  );

  const handleDueDateFromChange = useCallback(
    (date: string) => {
      onFilterChange({ ...filters, dueDateFrom: date || undefined });
    },
    [filters, onFilterChange]
  );

  const handleDueDateToChange = useCallback(
    (date: string) => {
      onFilterChange({ ...filters, dueDateTo: date || undefined });
    },
    [filters, onFilterChange]
  );

  const handleSprintChange = useCallback(
    (sprint: string) => {
      onFilterChange({ ...filters, sprint: sprint === '' ? undefined : sprint });
    },
    [filters, onFilterChange]
  );

  const handleClearAll = useCallback(() => {
    onFilterChange({});
  }, [onFilterChange]);

  const activeFilterCount = Object.values(filters).filter(
    (v) => v !== undefined && v !== ''
  ).length;

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div
        className="flex items-center justify-between cursor-pointer mb-4"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">Advanced Filters</h3>
          {activeFilterCount > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">
              {activeFilterCount}
            </span>
          )}
        </div>
        <button className="text-gray-600 hover:text-gray-900">
          {collapsed ? '▶' : '▼'}
        </button>
      </div>

      {!collapsed && (
        <>
          {/* Status Filter */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Status
            </label>
            <select
              value={filters.status || 'all'}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Priority
            </label>
            <select
              value={filters.priority || 'all'}
              onChange={(e) => handlePriorityChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          {/* Executor Filter */}
          {users.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Assigned To
              </label>
              <select
                value={filters.executor || ''}
                onChange={(e) => handleExecutorChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">All Users</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Due Date Range */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Due Date
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={filters.dueDateFrom || ''}
                onChange={(e) => handleDueDateFromChange(e.target.value)}
                placeholder="From"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <input
                type="date"
                value={filters.dueDateTo || ''}
                onChange={(e) => handleDueDateToChange(e.target.value)}
                placeholder="To"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          {/* Sprint Filter */}
          {sprints.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Sprint
              </label>
              <select
                value={filters.sprint || ''}
                onChange={(e) => handleSprintChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">All Sprints</option>
                {sprints.map((sprint) => (
                  <option key={sprint.id} value={sprint.id}>
                    {sprint.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Clear Filters */}
          {activeFilterCount > 0 && (
            <button
              onClick={handleClearAll}
              className="w-full px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear All Filters
            </button>
          )}
        </>
      )}
    </div>
  );
}
