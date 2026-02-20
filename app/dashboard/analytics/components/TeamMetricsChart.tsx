/**
 * TeamMetricsChart Component
 * Story 3.7: Analytics Dashboard UI
 */

'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TeamMetrics } from '@/lib/types/analytics';
import {
  formatNumber,
  formatPercentage,
} from '@/lib/utils/analytics-formatter';

interface TeamMetricsChartProps {
  teamMetrics: TeamMetrics;
  isLoading: boolean;
  error?: string;
}

export function TeamMetricsChart({
  teamMetrics,
  isLoading,
  error,
}: TeamMetricsChartProps) {
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800 font-medium">Error loading team metrics</p>
        <p className="text-red-600 text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-gray-100 rounded-lg p-6 animate-pulse h-96" />
    );
  }

  if (!teamMetrics || !teamMetrics.burndownTrend) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <p className="text-gray-600 font-medium">No team metrics available</p>
      </div>
    );
  }

  // Prepare chart data
  const chartData = teamMetrics.burndownTrend.map((point) => ({
    date: new Date(point.date).toLocaleDateString('pt-BR', {
      month: 'short',
      day: 'numeric',
    }),
    tasks: point.tasksCompleted,
  }));

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Team Metrics</h2>
        <p className="text-gray-600">Burndown trend and productivity overview</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
          <p className="text-gray-600 text-sm font-medium mb-1">Total Tasks</p>
          <p className="text-3xl font-bold text-blue-600">
            {formatNumber(teamMetrics.totalTasks)}
          </p>
          <p className="text-gray-500 text-xs mt-2">in this period</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
          <p className="text-gray-600 text-sm font-medium mb-1">Avg Daily</p>
          <p className="text-3xl font-bold text-green-600">
            {formatNumber(teamMetrics.avgDailyCompletion, 1)}
          </p>
          <p className="text-gray-500 text-xs mt-2">tasks per day</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
          <p className="text-gray-600 text-sm font-medium mb-1">Success Rate</p>
          <p className="text-3xl font-bold text-purple-600">
            {formatPercentage(teamMetrics.overallSuccessRate)}
          </p>
          <p className="text-gray-500 text-xs mt-2">approval rate</p>
        </div>
      </div>

      {/* Burndown Chart */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          Burndown Trend
        </h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                cursor={{ stroke: '#dbeafe' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="tasks"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
                name="Tasks Completed"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-500 text-sm text-center py-8">
            No burndown data available
          </p>
        )}
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
        <div>
          <p className="text-sm text-gray-600 font-medium mb-1">
            Avg Completion Time
          </p>
          <p className="text-2xl font-bold text-gray-900">
            {teamMetrics.teamAvgTime.toFixed(1)}h
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600 font-medium mb-1">
            Team Performance
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full"
              style={{
                width: `${Math.min(teamMetrics.overallSuccessRate * 100, 100)}%`,
              }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {formatPercentage(teamMetrics.overallSuccessRate)} performing well
          </p>
        </div>
      </div>
    </div>
  );
}
