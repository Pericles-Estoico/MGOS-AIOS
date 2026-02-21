export type UserRole = 'admin' | 'head' | 'executor' | 'qa';

// Type for API responses
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
