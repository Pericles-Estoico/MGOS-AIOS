/**
 * DateRangeSelector Component
 * Story 3.7: Analytics Dashboard UI
 */

'use client';

import React, { useState } from 'react';

interface DateRangeSelectorProps {
  onDateRangeChange: (days: number | null, start?: Date, end?: Date) => void;
  isLoading?: boolean;
}

export function DateRangeSelector({
  onDateRangeChange,
  isLoading = false,
}: DateRangeSelectorProps) {
  const [mode, setMode] = useState<'preset' | 'custom'>('preset');
  const [selectedDays, setSelectedDays] = useState(30);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const handlePresetClick = (days: number) => {
    setSelectedDays(days);
    setMode('preset');
    onDateRangeChange(days);
  };

  const handleCustomSubmit = () => {
    if (!customStart || !customEnd) {
      alert('Please select both start and end dates');
      return;
    }

    const start = new Date(customStart);
    const end = new Date(customEnd);

    if (start > end) {
      alert('Start date must be before end date');
      return;
    }

    setMode('custom');
    onDateRangeChange(null, start, end);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <h3 className="font-semibold text-gray-900 mb-4">Date Range</h3>

      {/* Preset Buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { label: '7 days', days: 7 },
          { label: '30 days', days: 30 },
          { label: '90 days', days: 90 },
        ].map(({ label, days }) => (
          <button
            key={days}
            onClick={() => handlePresetClick(days)}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              mode === 'preset' && selectedDays === days
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {label}
          </button>
        ))}
        <button
          onClick={() => setMode('custom')}
          disabled={isLoading}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            mode === 'custom'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Custom
        </button>
      </div>

      {/* Custom Date Range */}
      {mode === 'custom' && (
        <div className="space-y-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                id="startDate"
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                id="endDate"
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>
          </div>
          <button
            onClick={handleCustomSubmit}
            disabled={isLoading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Loading...' : 'Apply'}
          </button>
        </div>
      )}

      {/* Current Range Display */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          {mode === 'preset'
            ? `Showing last ${selectedDays} days`
            : customStart && customEnd
            ? `Showing ${customStart} to ${customEnd}`
            : 'Select a date range'}
        </p>
      </div>
    </div>
  );
}
