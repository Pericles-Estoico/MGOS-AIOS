/**
 * Burndown Chart Calculator
 * Calculates task completion progress over time
 */

interface AuditEntry {
  created_at: string;
  operation: string;
  old_value?: { status?: string };
  new_value?: { status?: string };
}

interface BurndownPoint {
  date: string;
  completed: number;
  ideal: number;
}

/**
 * Calculate burndown chart data from task status history
 * @param tasks Array of tasks with status_history
 * @param startDate Project start date (defaults to 7 days ago)
 * @param endDate Project end date (defaults to today)
 * @returns Array of daily burndown points
 */
export function calculateBurndown(
  tasks: Array<{ id: string; status_history?: AuditEntry[] }>,
  startDate?: Date,
  endDate?: Date
): BurndownPoint[] {
  const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const end = endDate || new Date();

  // Get all unique dates between start and end
  const dates: Date[] = [];
  const current = new Date(start);
  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  // Count total tasks
  const totalTasks = tasks.length;

  // Build completion timeline
  const completionByDate: { [key: string]: number } = {};

  tasks.forEach((task) => {
    if (!task.status_history || task.status_history.length === 0) return;

    // Find first "approved" status change
    const approved = task.status_history.find(
      (entry) =>
        entry.operation === 'status_change' &&
        entry.new_value?.status === 'approved'
    );

    if (approved) {
      const dateStr = new Date(approved.created_at)
        .toISOString()
        .split('T')[0];
      completionByDate[dateStr] = (completionByDate[dateStr] || 0) + 1;
    }
  });

  // Build cumulative completion
  let cumulativeCompleted = 0;
  const burndownPoints: BurndownPoint[] = [];

  dates.forEach((date) => {
    const dateStr = date.toISOString().split('T')[0];

    // Add tasks completed on this date
    if (completionByDate[dateStr]) {
      cumulativeCompleted += completionByDate[dateStr];
    }

    // Calculate ideal burndown (linear from total to 0)
    const dayIndex = Math.floor(
      (date.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)
    );
    const totalDays = Math.floor(
      (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)
    );
    const idealCompleted =
      totalDays > 0
        ? Math.round((totalTasks * dayIndex) / totalDays)
        : 0;

    burndownPoints.push({
      date: dateStr,
      completed: cumulativeCompleted,
      ideal: idealCompleted,
    });
  });

  return burndownPoints;
}

/**
 * Format date for display (YYYY-MM-DD → DD/MM)
 */
export function formatDateShort(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}`;
}

/**
 * Get chart dimensions and padding
 */
export function getChartDimensions() {
  return {
    width: 600,
    height: 300,
    padding: { top: 20, right: 20, bottom: 40, left: 50 },
  };
}

/**
 * Calculate scale for chart
 */
export function calculateScale(
  maxValue: number,
  dims: ReturnType<typeof getChartDimensions>
) {
  const chartWidth = dims.width - dims.padding.left - dims.padding.right;
  const chartHeight = dims.height - dims.padding.top - dims.padding.bottom;

  return {
    x: chartWidth / (maxValue > 0 ? maxValue : 1),
    y: chartHeight / (maxValue > 0 ? maxValue : 1),
  };
}
