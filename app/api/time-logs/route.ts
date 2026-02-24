/**
 * GET /api/time-logs - List time logs with filters
 * POST /api/time-logs - Create manual time log entry
 * @auth Required
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';

interface TimeLogPayload {
  task_id: string;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  description?: string;
  is_billable?: boolean;
}

// ============================================================================
// GET: List time logs
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ data: [] });
    }

    try {
      const { searchParams } = new URL(request.url);
      const taskId = searchParams.get('task_id');
      const fromDate = searchParams.get('from_date');
      const toDate = searchParams.get('to_date');
      const isBillable = searchParams.get('is_billable');
      const limit = parseInt(searchParams.get('limit') || '20');
      const offset = parseInt(searchParams.get('offset') || '0');

      const supabase = createSupabaseServerClient();
      if (!supabase) {
        return NextResponse.json({
          data: [],
          pagination: { total: 0, limit, offset, pages: 0 }
        });
      }

      // Build query
      let query = supabase
        .from('time_logs')
        .select('*', { count: 'exact' })
        .eq('user_id', session.user.id)
        .order('start_time', { ascending: false });

      // Apply filters
      if (taskId) {
        query = query.eq('task_id', taskId);
      }

      if (isBillable) {
        query = query.eq('is_billable', isBillable === 'true');
      }

      if (fromDate) {
        query = query.gte('start_time', `${fromDate}T00:00:00Z`);
      }

      if (toDate) {
        query = query.lte('start_time', `${toDate}T23:59:59Z`);
      }

      // Apply pagination
      query = query.limit(limit).offset(offset);

      const { data, error, count } = await query;

      if (error) {
        console.error('Supabase error:', error);
        return NextResponse.json({
          data: [],
          pagination: { total: 0, limit, offset, pages: 0 }
        });
      }

      // Calculate totals
      const totalMinutes = (data || []).reduce((sum, log) => sum + (log.duration_minutes || 0), 0);
      const billableMinutes = (data || [])
        .filter((log: any) => log.is_billable)
        .reduce((sum: number, log: any) => sum + (log.duration_minutes || 0), 0);
      const billableHours = (billableMinutes / 60).toFixed(2);

      return NextResponse.json({
        data: data || [],
        pagination: {
          total: count || 0,
          limit,
          offset,
          pages: Math.ceil((count || 0) / limit)
        },
        totals: {
          total_entries: (data || []).length,
          total_minutes: totalMinutes,
          total_billable_minutes: billableMinutes,
          total_billable_hours: parseFloat(billableHours),
          total_non_billable_minutes: totalMinutes - billableMinutes
        }
      });

    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({
        data: [],
        pagination: { total: 0, limit: 20, offset: 0, pages: 0 }
      });
    }

  } catch (error) {
    console.error('Error fetching time logs:', error);
    return NextResponse.json({
      data: [],
      pagination: { total: 0, limit: 20, offset: 0, pages: 0 }
    });
  }
}

// ============================================================================
// POST: Create manual time log
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ data: null }, { status: 401 });
    }

    try {
      const body = await request.json() as TimeLogPayload;
      const { task_id, start_time, end_time, duration_minutes, description, is_billable } = body;

      // Validate required fields
      if (!task_id || !start_time) {
        return NextResponse.json(
          { error: 'Missing required fields: task_id, start_time' },
          { status: 400 }
        );
      }

      // Must have either end_time or duration_minutes
      if (!end_time && !duration_minutes) {
        return NextResponse.json(
          { error: 'Must provide either end_time or duration_minutes' },
          { status: 400 }
        );
      }

      // Calculate duration if end_time provided
      let calculatedDuration = duration_minutes;
      if (end_time && !duration_minutes) {
        const startMs = new Date(start_time).getTime();
        const endMs = new Date(end_time).getTime();
        calculatedDuration = Math.round((endMs - startMs) / (1000 * 60));
      }

      if (!calculatedDuration || calculatedDuration <= 0) {
        return NextResponse.json(
          { error: 'Duration must be greater than 0 minutes' },
          { status: 400 }
        );
      }

      // Validate start_time is not in future
      if (new Date(start_time).getTime() > Date.now()) {
        return NextResponse.json(
          { error: 'Cannot log time in the future' },
          { status: 400 }
        );
      }

      const supabase = createSupabaseServerClient();
      if (!supabase) {
        return NextResponse.json({
          data: null
        }, { status: 201 });
      }

      // Verify task exists and is assigned to user
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select('id, assigned_to')
        .eq('id', task_id)
        .single();

      if (taskError || !task) {
        return NextResponse.json(
          { error: 'Task not found' },
          { status: 404 }
        );
      }

      if ((task as any).assigned_to !== session.user.id) {
        return NextResponse.json(
          { error: 'Task not assigned to you' },
          { status: 403 }
        );
      }

      // Create time log
      const { data, error } = await supabase
        .from('time_logs')
        .insert({
          task_id,
          user_id: session.user.id,
          start_time,
          end_time: end_time || new Date(new Date(start_time).getTime() + (calculatedDuration || 0) * 60 * 1000).toISOString(),
          duration_minutes: calculatedDuration,
          description: description || null,
          is_billable: is_billable !== false,
          logged_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return NextResponse.json(
          { error: 'Failed to create time log' },
          { status: 500 }
        );
      }

      // Log audit entry
      await supabase.from('audit_logs').insert({
        entity_type: 'time_log',
        entity_id: (data as any).id,
        action: 'INSERT',
        old_values: null,
        new_values: data,
        changed_by: session.user.id,
        changed_at: new Date().toISOString()
      });

      return NextResponse.json(data, { status: 201 });

    } catch (parseError) {
      console.error('Request parsing error:', parseError);
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error creating time log:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
