/**
 * AnalyticsContainer Component
 * Story 3.7: Analytics Dashboard UI
 * Main orchestrator for dashboard data flow
 */

'use client';

import React, { useState, useCallback } from 'react';
import { useAnalyticsMetrics } from '@/lib/hooks/useAnalyticsMetrics';
import { PerUserMetricsCard } from './PerUserMetricsCard';
import { TeamMetricsChart } from './TeamMetricsChart';
import { QAMetricsCard } from './QAMetricsCard';
import { DateRangeSelector } from './DateRangeSelector';
import { MemberFilter } from './MemberFilter';
import type { AnalyticsContainerProps } from '@/lib/types/analytics';

export function AnalyticsContainer({
  userRole,
  userId,
}: AnalyticsContainerProps) {
  const [days, setDays] = useState(30);
  const [customStart, setCustomStart] = useState<Date | undefined>();
  const [customEnd, setCustomEnd] = useState<Date | undefined>();
  const [selectedMemberId, setSelectedMemberId] = useState<string | undefined>();

  // Determine which userId to fetch
  const fetchUserId =
    userRole === 'admin' || userRole === 'head'
      ? selectedMemberId || undefined
      : userId;

  const { data, isLoading, error } = useAnalyticsMetrics({
    days: customStart || customEnd ? undefined : days,
    customStart,
    customEnd,
    userId: fetchUserId,
  });

  const handleDateRangeChange = useCallback(
    (newDays: number | null, start?: Date, end?: Date) => {
      if (newDays !== null) {
        setDays(newDays);
        setCustomStart(undefined);
        setCustomEnd(undefined);
      } else {
        setCustomStart(start);
        setCustomEnd(end);
      }
      setSelectedMemberId(undefined);
    },
    []
  );

  const handleMemberSelect = useCallback((memberId: string | null) => {
    setSelectedMemberId(memberId || undefined);
  }, []);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-red-900 mb-2">
          Error Loading Analytics
        </h2>
        <p className="text-red-700">{error.message}</p>
      </div>
    );
  }

  const canViewTeamMetrics = userRole === 'admin' || userRole === 'head';
  const canFilterMembers = canViewTeamMetrics;

  return (
    <div className="space-y-6">
      {/* Controls Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DateRangeSelector
          onDateRangeChange={handleDateRangeChange}
          isLoading={isLoading}
        />

        {canFilterMembers && data && data.perUserMetrics.length > 0 && (
          <MemberFilter
            members={data.perUserMetrics}
            selectedMemberId={selectedMemberId}
            onMemberSelect={handleMemberSelect}
            disabled={isLoading}
          />
        )}
      </div>

      {/* Per-User Metrics */}
      {data && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {selectedMemberId && data.perUserMetrics.length > 0
              ? `${data.perUserMetrics[0].userName}'s Metrics`
              : 'Team Member Performance'}
          </h2>
          <PerUserMetricsCard
            metrics={
              selectedMemberId
                ? data.perUserMetrics.filter((m) => m.userId === selectedMemberId)
                : data.perUserMetrics
            }
            isLoading={isLoading}
            error={error?.message}
          />
        </div>
      )}

      {/* Team & QA Metrics - Only for admin/head */}
      {canViewTeamMetrics && data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TeamMetricsChart
              teamMetrics={data.teamMetrics}
              isLoading={isLoading}
              error={error?.message}
            />
          </div>
          <div>
            <QAMetricsCard
              qaMetrics={data.qaMetrics}
              isLoading={isLoading}
              error={error?.message}
            />
          </div>
        </div>
      )}

      {/* User Notice if no team metrics access */}
      {!canViewTeamMetrics && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-900 text-sm">
            💡 Team and QA metrics are only available to admins and team leads.
          </p>
        </div>
      )}

      {/* Empty State */}
      {!data ||
        (data.perUserMetrics.length === 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <p className="text-gray-600 font-medium">
              No data available for the selected period
            </p>
            <p className="text-gray-500 text-sm mt-1">
              Try adjusting the date range or member filter
            </p>
          </div>
        ))}
    </div>
  );
}
