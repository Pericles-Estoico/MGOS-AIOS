/**
 * Analytics Types & Interfaces
 * Story 3.7: Analytics Dashboard UI
 */

// From Story 3.6 API Response
export interface PerUserMetric {
  userId: string;
  userName: string;
  taskCount: number;
  avgCompletionTime: number; // hours
  totalHours: number;
  approvalRate: number; // 0-1
  rejectionRate: number; // 0-1
  lastCompleted: string; // ISO 8601
}

export interface TeamMetrics {
  totalTasks: number;
  avgDailyCompletion: number;
  burndownTrend: BurndownPoint[];
  teamAvgTime: number; // hours
  overallSuccessRate: number; // 0-1
}

export interface BurndownPoint {
  date: string; // YYYY-MM-DD
  tasksCompleted: number;
}

export interface QAMetrics {
  avgReviewTime: number; // hours
  pendingReviews: number;
  reviewSLA: number; // 0-1 (% completed < 24h)
}

export interface AnalyticsResponse {
  period: {
    start: string;
    end: string;
  };
  perUserMetrics: PerUserMetric[];
  teamMetrics: TeamMetrics;
  qaMetrics: QAMetrics;
}

// Component Props
export interface PerUserMetricsCardProps {
  metrics: PerUserMetric[];
  isLoading: boolean;
  error?: string;
}

export interface TeamMetricsChartProps {
  teamMetrics: TeamMetrics;
  isLoading: boolean;
  error?: string;
}

export interface QAMetricsCardProps {
  qaMetrics: QAMetrics;
  isLoading: boolean;
  error?: string;
}

export interface DateRangeSelectorProps {
  onDateRangeChange: (days: number | null, start?: Date, end?: Date) => void;
  isLoading?: boolean;
}

export interface MemberFilterProps {
  members: PerUserMetric[];
  selectedMemberId?: string;
  onMemberSelect: (userId: string | null) => void;
  disabled?: boolean;
}

export interface AnalyticsContainerProps {
  userRole: 'admin' | 'head' | 'user' | 'executor';
  userId: string;
}

// Hook Types
export interface UseAnalyticsMetricsOptions {
  days?: number;
  customStart?: Date;
  customEnd?: Date;
  userId?: string;
}

export interface UseAnalyticsMetricsReturn {
  data: AnalyticsResponse | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export interface UseUserRoleReturn {
  role: 'admin' | 'head' | 'user' | 'executor';
  userId: string;
  canViewTeamMetrics: boolean;
  canFilterMembers: boolean;
}

// Dashboard State
export interface DashboardState {
  dateRange: {
    days?: number;
    customStart?: Date;
    customEnd?: Date;
  };
  selectedMemberId?: string;
  isLoading: boolean;
  error: string | null;
}
