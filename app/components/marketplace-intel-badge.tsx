/**
 * Component: MarketplaceIntelBadge
 * Purpose: Display AI-generated task indicator with channel color
 * Usage: Show on task list and task detail pages
 */

import React from 'react';

interface MarketplaceIntelBadgeProps {
  channel?: string;
  approved?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const channelColors: Record<string, { bg: string; text: string; border: string }> = {
  amazon: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
  },
  mercadolivre: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  shopee: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
  },
  shein: {
    bg: 'bg-pink-50',
    text: 'text-pink-700',
    border: 'border-pink-200',
  },
  tiktokshop: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
  },
  kaway: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
};

const channelEmojis: Record<string, string> = {
  amazon: '📦',
  mercadolivre: '🟦',
  shopee: '🏪',
  shein: '👗',
  tiktokshop: '🎵',
  kaway: '🎁',
};

export function MarketplaceIntelBadge({
  channel = 'amazon',
  approved = false,
  size = 'md',
  showLabel = true,
}: MarketplaceIntelBadgeProps) {
  const colors = channelColors[channel] || channelColors.amazon;
  const emoji = channelEmojis[channel] || '📦';

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const statusBadge = approved ? '✅' : '🤖';
  const statusText = approved ? 'Aprovado' : 'Pendente';

  return (
    <div
      className={`
        inline-flex items-center gap-2
        rounded-full border
        ${colors.bg} ${colors.text} ${colors.border}
        ${sizeClasses[size]}
        font-medium
      `}
    >
      <span className="text-lg">{statusBadge}</span>
      {showLabel && (
        <>
          <span>{emoji}</span>
          <span className="capitalize">{channel}</span>
          <span className="text-xs opacity-75">• {statusText}</span>
        </>
      )}
    </div>
  );
}

/**
 * AITaskIndicator: Compact indicator for task list view
 * Shows just the AI badge without channel context
 */
export function AITaskIndicator({
  approved = false,
  channelInitial = 'A',
}: {
  approved?: boolean;
  channelInitial?: string;
}) {
  return (
    <div
      className={`
        flex items-center justify-center
        w-7 h-7 rounded-full
        text-xs font-bold
        border border-dashed
        ${
          approved
            ? 'bg-green-100 text-green-700 border-green-300'
            : 'bg-yellow-100 text-yellow-700 border-yellow-300'
        }
      `}
      title={approved ? 'Tarefa AI aprovada' : 'Tarefa AI pendente de aprovação'}
    >
      {approved ? '✓' : 'AI'}
    </div>
  );
}

/**
 * ChannelTag: Simple channel identifier
 */
export function ChannelTag({
  channel = 'amazon',
  size = 'sm',
}: {
  channel?: string;
  size?: 'sm' | 'md';
}) {
  const colors = channelColors[channel] || channelColors.amazon;
  const emoji = channelEmojis[channel] || '📦';

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1
        rounded px-2 py-1
        ${colors.bg} ${colors.text}
        text-xs font-medium
        ${sizeClasses[size]}
      `}
    >
      <span>{emoji}</span>
      <span className="capitalize">{channel}</span>
    </span>
  );
}
