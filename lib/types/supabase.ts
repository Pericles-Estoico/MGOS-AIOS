import type { SupabaseClient } from '@supabase/supabase-js';

export interface Task {
  id: string;
  status: string;
  priority: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  source_type?: string;
  admin_approved?: boolean;
  sprint_id?: string;
  estimated_hours?: number;
}

export interface TeamMetric {
  id: string;
  sprint_id?: string;
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  blocked_tasks: number;
  quality_score: number;
  captured_at: string;
}

export interface UserMetric {
  id: string;
  user_id: string;
  sprint_id?: string;
  tasks_completed: number;
  tasks_in_progress: number;
  quality_score: number;
  productivity_index: number;
  captured_at: string;
}

export interface TaskMetric {
  id: string;
  final_status: string;
  estimate_hours: number;
  actual_hours: number;
  captured_at: string;
}

export interface AuditLog {
  id?: string;
  entity_type: string;
  entity_id: string;
  action: string;
  changed_by: string;
  old_values: Record<string, unknown>;
  new_values: Record<string, unknown>;
}

export interface User {
  id: string;
  role: string;
  email?: string;
  name?: string;
}

export interface ActivityEvent {
  id: string;
  action: string;
  created_at: string;
  user_id: string;
  user: {
    name: string;
    email: string;
  };
  details?: Record<string, unknown>;
}

export type SupabaseClientType = SupabaseClient;
