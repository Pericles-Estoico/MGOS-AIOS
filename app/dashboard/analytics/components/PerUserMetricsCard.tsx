/**
 * PerUserMetricsCard Component
 * Story 3.7: Analytics Dashboard UI
 */

'use client';

import React from 'react';
import { PerUserMetric } from '@/lib/types/analytics';
import {
  formatHours,
  formatPercentage,
  formatDateTime,
  getApprovalRateColor,
  getCardBackground,
} from '@/lib/utils/analytics-formatter';

interface PerUserMetricsCardProps {
  metrics: PerUserMetric[];
  isLoading: boolean;
  error?: string;
}

export function PerUserMetricsCard({
  metrics,
  isLoading,
  error,
}: PerUserMetricsCardProps) {
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800 font-medium">Error loading per-user metrics</p>
        <p className="text-red-600 text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-gray-100 rounded-lg p-6 animate-pulse h-40"
          />
        ))}
      </div>
    );
  }

  if (!metrics || metrics.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <p className="text-gray-600 font-medium">No per-user metrics available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {metrics.map((metric, index) => (
        <div
          key={metric.userId}
          className={`${getCardBackground(index)} border border-gray-200 rounded-lg p-6`}
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">
                {metric.userName}
              </h3>
              <p className="text-gray-500 text-sm">Tasks completed</p>
            </div>
            <div className="text-3xl font-bold text-gray-700">
              {metric.taskCount}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm">Avg completion time:</span>
              <span className="font-medium text-gray-900">
                {formatHours(metric.avgCompletionTime)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm">Total hours:</span>
              <span className="font-medium text-gray-900">
                {formatHours(metric.totalHours)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm">Approval rate:</span>
              <span className={`font-medium ${getApprovalRateColor(metric.approvalRate)}`}>
                {formatPercentage(metric.approvalRate)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm">Rejection rate:</span>
              <span className="font-medium text-gray-900">
                {formatPercentage(metric.rejectionRate)}
              </span>
            </div>

            <div className="pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Last completed: {formatDateTime(metric.lastCompleted)}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
