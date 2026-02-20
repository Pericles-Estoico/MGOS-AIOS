/**
 * QAMetricsCard Component
 * Story 3.7: Analytics Dashboard UI
 */

'use client';

import React from 'react';
import { QAMetrics } from '@/lib/types/analytics';
import { formatHours, formatPercentage } from '@/lib/utils/analytics-formatter';

interface QAMetricsCardProps {
  qaMetrics: QAMetrics;
  isLoading: boolean;
  error?: string;
}

export function QAMetricsCard({ qaMetrics, isLoading, error }: QAMetricsCardProps) {
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800 font-medium">Error loading QA metrics</p>
        <p className="text-red-600 text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-gray-100 rounded-lg p-6 animate-pulse h-48" />
    );
  }

  if (!qaMetrics) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <p className="text-gray-600 font-medium">No QA metrics available</p>
      </div>
    );
  }

  const getSLAStatusColor = (sla: number): string => {
    if (sla >= 0.9) return 'text-green-600 bg-green-50';
    if (sla >= 0.75) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">QA Metrics</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Average Review Time */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-gray-600 text-sm font-medium mb-2">
            Avg Review Time
          </p>
          <p className="text-4xl font-bold text-purple-600">
            {formatHours(qaMetrics.avgReviewTime)}
          </p>
          <p className="text-gray-500 text-xs mt-2">time to review tasks</p>
        </div>

        {/* Pending Reviews */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-gray-600 text-sm font-medium mb-2">
            Pending Reviews
          </p>
          <p className="text-4xl font-bold text-blue-600">
            {qaMetrics.pendingReviews}
          </p>
          <p className="text-gray-500 text-xs mt-2">awaiting review</p>
        </div>

        {/* Review SLA */}
        <div className={`rounded-lg p-4 shadow-sm ${getSLAStatusColor(qaMetrics.reviewSLA)}`}>
          <p className="text-gray-600 text-sm font-medium mb-2">
            SLA Compliance
          </p>
          <p className="text-4xl font-bold">
            {formatPercentage(qaMetrics.reviewSLA)}
          </p>
          <p className="text-gray-500 text-xs mt-2">within 24 hours</p>
        </div>
      </div>

      {/* Status Bar */}
      <div className="mt-6 pt-6 border-t border-purple-200">
        <div className="bg-white rounded-lg p-4">
          <p className="text-xs text-gray-600 mb-2">Quality Status</p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
              style={{ width: `${Math.min(qaMetrics.reviewSLA * 100, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {qaMetrics.reviewSLA >= 0.9 ? '✓ Excellent' : '⚠ Needs improvement'}
          </p>
        </div>
      </div>
    </div>
  );
}
