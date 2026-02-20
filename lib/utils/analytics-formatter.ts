/**
 * Analytics Formatter Utilities
 * Story 3.7: Analytics Dashboard UI
 */

/**
 * Format a number as a duration in hours with 1 decimal place
 */
export function formatHours(hours: number): string {
  return `${hours.toFixed(1)}h`;
}

/**
 * Format a number as a percentage (0-1 to 0-100%)
 */
export function formatPercentage(decimal: number, decimals = 0): string {
  const percentage = Math.round(decimal * 100 * Math.pow(10, decimals)) / Math.pow(10, decimals);
  return `${percentage.toFixed(decimals)}%`;
}

/**
 * Format a count with thousands separator
 */
export function formatCount(count: number): string {
  return count.toLocaleString();
}

/**
 * Format an ISO 8601 date to locale format
 */
export function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format an ISO 8601 timestamp to locale format with time
 */
export function formatDateTime(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Truncate username for display
 */
export function truncateName(name: string, maxLength = 20): string {
  if (name.length <= maxLength) return name;
  return `${name.substring(0, maxLength - 3)}...`;
}

/**
 * Format a large number with abbreviation (K, M, B)
 */
export function formatCompactNumber(num: number): string {
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

/**
 * Get color for approval rate (green for high, red for low)
 */
export function getApprovalRateColor(rate: number): string {
  if (rate >= 0.9) return 'text-green-600';
  if (rate >= 0.75) return 'text-yellow-600';
  return 'text-red-600';
}

/**
 * Get background color for metrics card
 */
export function getCardBackground(index: number): string {
  const colors = ['bg-blue-50', 'bg-green-50', 'bg-purple-50', 'bg-orange-50', 'bg-pink-50'];
  return colors[index % colors.length];
}

/**
 * Format status badge class
 */
export function getStatusBadgeClass(status: 'good' | 'warning' | 'critical'): string {
  const classes = {
    good: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    critical: 'bg-red-100 text-red-800',
  };
  return classes[status];
}

/**
 * Format numeric value with thousands and decimals
 */
export function formatNumber(num: number, decimals = 0): string {
  return num.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
