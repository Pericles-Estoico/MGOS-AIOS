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

// ============================================================================
// Sub-Agent Types (Autonomous Execution)
// ============================================================================

export type SubTaskType = 'analysis' | 'content_generation' | 'delegation';

export type SubTaskStatus = 'pending' | 'in_progress' | 'awaiting_checkpoint' | 'completed' | 'failed';

export interface CheckpointData {
  [key: string]: unknown;
}

export interface SubTaskResultData {
  [key: string]: unknown;
}

export interface SubTask {
  id: string;
  parent_task_id: string;
  sub_agent_id: string;
  type: SubTaskType;
  title: string;
  description?: string;

  // Status workflow
  status: SubTaskStatus;

  // Checkpoint workflow
  checkpoint_data?: CheckpointData;
  result_data?: SubTaskResultData;
  checkpoint_approved_by?: string;
  checkpoint_approved_at?: string;

  // Ordering
  order_index: number;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface SubTaskRequest {
  parent_task_id: string;
  sub_agent_id: string;
  type: SubTaskType;
  title: string;
  description?: string;
  order_index?: number;
}

export interface SubTaskCheckpointRequest {
  subtask_id: string;
  checkpoint_data: CheckpointData;
}

export interface SubTaskApprovalRequest {
  subtask_id: string;
  user_id: string;
  notes?: string;
}
