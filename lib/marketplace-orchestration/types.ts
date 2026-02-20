/**
 * Marketplace Orchestration System - Type Definitions
 * Defines all types for the marketplace task management and orchestration
 */

export type Marketplace = 'amazon' | 'shopee' | 'mercadolivre' | 'shein' | 'tiktokshop' | 'kaway';

export type TaskStatus =
  | 'pending'
  | 'awaiting_approval'
  | 'approved'
  | 'in_progress'
  | 'completed'
  | 'rejected';

export type TaskCategory = 'optimization' | 'best-practice' | 'scaling' | 'analysis';

export type TaskPriority = 'high' | 'medium' | 'low';

export interface MarketplaceTask {
  id: string;
  marketplace: Marketplace;
  createdBy: string;  // Sub-agent ID (e.g., 'marketplace-amazon')
  title: string;
  description: string;
  category: TaskCategory;

  // Status Workflow
  status: TaskStatus;

  // Timestamps (ISO 8601 format)
  createdAt: string;      // When sub-agent created
  submittedAt?: string;   // When submitted for approval
  approvedAt?: string;    // When user approved
  startedAt?: string;     // When team member started
  completedAt?: string;   // When completed

  // Assignment & Approval
  assignedTo?: string;      // User/Team member ID
  approvedBy?: string;      // User ID who approved

  // Tracking
  estimatedHours: number;
  actualHours?: number;
  priority: TaskPriority;

  // Additional metadata
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface TaskApprovalRequest {
  taskIds: string[];
  approved: boolean;
  reason?: string;
}

export interface TaskAssignmentRequest {
  taskId: string;
  assignedTo: string;
}

export interface TaskCompletionRequest {
  taskId: string;
  actualHours: number;
  notes?: string;
}

export interface OrchestratorConfig {
  dailyScheduleTime: string; // e.g., "08:00"
  batchApprovalEnabled: boolean;
  autoAssignEnabled: boolean;
  notificationChannels: ('email' | 'slack' | 'in-app')[];
}

export interface TaskDailyStats {
  marketplace: Marketplace;
  created: number;
  approved: number;
  inProgress: number;
  completed: number;
  avgCompletionTime: number; // in hours
}
