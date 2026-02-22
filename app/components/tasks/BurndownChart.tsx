'use client';

import React, { useMemo } from 'react';
import {
  calculateBurndown,
  formatDateShort,
  getChartDimensions,
  calculateScale,
} from '@/utils/burndown-calculator';

interface StatusHistoryEntry {
  id: string;
  operation: string;
  old_value?: Record<string, unknown>;
  new_value?: Record<string, unknown>;
  created_by?: string;
  created_at: string;
}

interface BurndownChartProps {
  tasks: Array<{ id: string; status_history?: StatusHistoryEntry[] }>;
  title?: string;
  showLegend?: boolean;
}

export default function BurndownChart({
  tasks,
  title = 'Burndown Chart',
  showLegend = true,
}: BurndownChartProps) {
  const data = useMemo(() => calculateBurndown(tasks), [tasks]);

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="text-center py-12 text-gray-500">
          No task completion data available
        </div>
      </div>
    );
  }

  const maxCompleted = Math.max(...data.map((d) => d.completed));
  const maxIdeal = Math.max(...data.map((d) => d.ideal));
  const maxValue = Math.max(maxCompleted, maxIdeal, 1);

  const dims = getChartDimensions();
  const scale = calculateScale(data.length, dims);

  // SVG path strings
  const completedPath = data
    .map(
      (point, index) =>
        `${dims.padding.left + index * scale.x},${dims.height - dims.padding.bottom - point.completed * (dims.height - dims.padding.top - dims.padding.bottom) / maxValue}`
    )
    .join(' L ');

  const idealPath = data
    .map(
      (point, index) =>
        `${dims.padding.left + index * scale.x},${dims.height - dims.padding.bottom - point.ideal * (dims.height - dims.padding.top - dims.padding.bottom) / maxValue}`
    )
    .join(' L ');

  // Y-axis labels
  const yLabels = [0, maxValue / 2, maxValue].map((val) => Math.floor(val));

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">{title}</h3>

      {/* SVG Chart */}
      <div className="overflow-x-auto">
        <svg
          width={dims.width}
          height={dims.height}
          viewBox={`0 0 ${dims.width} ${dims.height}`}
          className="border border-gray-200 rounded-lg bg-gray-50"
        >
          {/* Grid lines */}
          {yLabels.map((label, index) => {
            const y =
              dims.height -
              dims.padding.bottom -
              (index * (dims.height - dims.padding.top - dims.padding.bottom)) /
                2;
            return (
              <g key={`grid-${label}`}>
                <line
                  x1={dims.padding.left}
                  y1={y}
                  x2={dims.width - dims.padding.right}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeDasharray="4"
                />
                <text
                  x={dims.padding.left - 10}
                  y={y + 4}
                  fontSize="12"
                  textAnchor="end"
                  fill="#6b7280"
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* X-axis */}
          <line
            x1={dims.padding.left}
            y1={dims.height - dims.padding.bottom}
            x2={dims.width - dims.padding.right}
            y2={dims.height - dims.padding.bottom}
            stroke="#374151"
            strokeWidth="2"
          />

          {/* Y-axis */}
          <line
            x1={dims.padding.left}
            y1={dims.padding.top}
            x2={dims.padding.left}
            y2={dims.height - dims.padding.bottom}
            stroke="#374151"
            strokeWidth="2"
          />

          {/* Ideal line (dashed) */}
          <polyline
            points={idealPath}
            fill="none"
            stroke="#9ca3af"
            strokeWidth="2"
            strokeDasharray="5,5"
          />

          {/* Completed line (solid) */}
          <polyline
            points={completedPath}
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
          />

          {/* Data points on completed line */}
          {data.map((point, index) => {
            const x = dims.padding.left + index * scale.x;
            const y =
              dims.height -
              dims.padding.bottom -
              (point.completed * (dims.height - dims.padding.top - dims.padding.bottom)) /
                maxValue;
            return (
              <circle
                key={`point-${index}`}
                cx={x}
                cy={y}
                r="4"
                fill="#10b981"
                stroke="white"
                strokeWidth="2"
              />
            );
          })}

          {/* X-axis labels (every nth date) */}
          {data.map((point, index) => {
            // Show every 2nd or 3rd label to avoid crowding
            const showLabel =
              index === 0 ||
              index === data.length - 1 ||
              index % Math.ceil(data.length / 5) === 0;

            if (!showLabel) return null;

            const x = dims.padding.left + index * scale.x;
            return (
              <text
                key={`label-${index}`}
                x={x}
                y={dims.height - dims.padding.bottom + 20}
                fontSize="12"
                textAnchor="middle"
                fill="#6b7280"
              >
                {formatDateShort(point.date)}
              </text>
            );
          })}

          {/* Y-axis label */}
          <text
            x={15}
            y={dims.padding.top - 5}
            fontSize="12"
            fill="#6b7280"
            fontWeight="bold"
          >
            Tasks
          </text>
        </svg>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="mt-6 flex gap-6 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-teal-600"></div>
            <span className="text-sm text-gray-700">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-0.5 bg-gray-400"
              style={{ backgroundImage: 'repeating-linear-gradient(to right, #9ca3af 0px, #9ca3af 5px, transparent 5px, transparent 10px)' }}
            ></div>
            <span className="text-sm text-gray-700">Ideal</span>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="bg-teal-50 p-4 rounded-lg text-center">
          <p className="text-sm text-gray-600">Completed</p>
          <p className="text-2xl font-bold text-teal-600">{maxCompleted}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-2xl font-bold text-gray-900">{data.length > 0 ? maxValue : 0}</p>
        </div>
        <div className="bg-emerald-50 p-4 rounded-lg text-center">
          <p className="text-sm text-gray-600">Progress</p>
          <p className="text-2xl font-bold text-emerald-600">
            {maxValue > 0
              ? Math.round((maxCompleted / maxValue) * 100)
              : 0}%
          </p>
        </div>
      </div>
    </div>
  );
}
