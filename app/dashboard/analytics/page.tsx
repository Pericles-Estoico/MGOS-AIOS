/**
 * Analytics Dashboard Page
 * Story 3.7: Analytics Dashboard UI - Phase 2
 * Route: /dashboard/analytics
 */

import React from 'react';
import { AnalyticsContainer } from './components/AnalyticsContainer';

/**
 * Analytics Dashboard Page
 * Displays team productivity metrics and performance analytics
 */
export default function AnalyticsDashboardPage() {
  // TODO: In production, get actual user role and ID from NextAuth session
  // For now, using demo values - will be replaced with real auth
  const userRole = 'admin' as const;
  const userId = 'user-123';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Analytics Dashboard
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Monitor team productivity and track performance metrics
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnalyticsContainer userRole={userRole} userId={userId} />
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-500 text-sm">
            Data is refreshed every 5 minutes. Last updated:{' '}
            <span className="text-gray-700 font-medium">
              {new Date().toLocaleTimeString('pt-BR')}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
