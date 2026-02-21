/**
 * API Route: /api/marketplace-intel/tasks
 *
 * Endpoints for Marketplace Intelligence System:
 * POST   - Create AI-generated task card (service role only)
 * GET    - List pending AI tasks (admin only)
 *
 * Purpose: Manage AI-generated task cards from marketplace intelligence loop
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ============================================================================
// POST: Create AI-Generated Task Card
// ============================================================================
/**
 * Creates a new AI-generated task card in the system.
 * Only accessible via service_role key or AIOS internal token.
 *
 * Request body:
 * {
 *   "title": "UPDATE: Amazon A9 Algorithm Change — Ranking Factor Shift",
 *   "description": "What changed, why it matters, what to do",
 *   "step_by_step": "Markdown with numbered steps",
 *   "estimated_hours": 6,
 *   "priority": "high",
 *   "channel": "amazon",
 *   "ai_change_type": "algorithm",
 *   "ai_source_url": "https://...",
 *   "due_date": "2026-02-26"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Validate authorization header (service role or AIOS token)
    const authHeader = request.headers.get('authorization');
    const isServiceRole = authHeader && supabaseServiceKey ? authHeader.includes(supabaseServiceKey.substring(0, 20)) : false;
    const isAiosToken = authHeader?.startsWith('Bearer aios-');

    if (!isServiceRole && !isAiosToken) {
      return NextResponse.json(
        { error: 'Unauthorized - service role or AIOS token required' },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body = await request.json();

    // 3. Validate required fields
    const requiredFields = ['title', 'description', 'step_by_step', 'channel', 'priority'];
    const missingFields = requiredFields.filter(field => !body[field]);
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // 4. Validate enum values
    const validChannels = ['amazon', 'mercadolivre', 'shopee', 'shein', 'tiktokshop', 'kaway'];
    if (!validChannels.includes(body.channel)) {
      return NextResponse.json(
        { error: `Invalid channel: ${body.channel}` },
        { status: 400 }
      );
    }

    const validPriorities = ['high', 'medium', 'low'];
    if (!validPriorities.includes(body.priority)) {
      return NextResponse.json(
        { error: `Invalid priority: ${body.priority}` },
        { status: 400 }
      );
    }

    const validChangeTypes = ['algorithm', 'ads', 'content', 'policies', 'features'];
    if (body.ai_change_type && !validChangeTypes.includes(body.ai_change_type)) {
      return NextResponse.json(
        { error: `Invalid ai_change_type: ${body.ai_change_type}` },
        { status: 400 }
      );
    }

    // 5. Create task object with AI-specific fields
    const taskData = {
      title: body.title,
      description: body.description,
      status: 'a_fazer',
      priority: body.priority,
      frente: `Marketplace - ${body.channel.toUpperCase()}`,
      channel: body.channel,
      source_type: 'ai_generated',
      admin_approved: false,
      estimated_hours: body.estimated_hours || null,
      step_by_step: body.step_by_step,
      ai_source_url: body.ai_source_url || null,
      ai_change_type: body.ai_change_type || null,
      ai_generated_at: new Date().toISOString(),
      due_date: body.due_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      assigned_to: '00000000-0000-0000-0000-000000000000', // Placeholder, will be set on approval
      created_by: '00000000-0000-0000-0000-000000000000', // System user
    };

    // 6. Insert into database
    const { data, error } = await supabase
      .from('tasks')
      .insert([taskData])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to create task', details: error.message },
        { status: 500 }
      );
    }

    // 7. Return created task
    return NextResponse.json(
      {
        success: true,
        task: data,
        message: `AI task created - awaiting admin approval (ID: ${data.id})`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/marketplace-intel/tasks error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET: List Pending AI Tasks (Admin Only)
// ============================================================================
/**
 * Lists all AI-generated tasks pending admin approval.
 * Only accessible to authenticated users with admin role.
 *
 * Query parameters:
 * - channel: Filter by marketplace channel (optional)
 * - limit: Results per page (default: 20, max: 100)
 * - offset: Pagination offset (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions) as Session | null;
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado - por favor, faça login' },
        { status: 401 }
      );
    }

    // 2. Check admin role
    const user = session.user;
    if (user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Apenas administradores podem acessar tarefas de inteligência' },
        { status: 403 }
      );
    }

    // 3. Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const channel = searchParams.get('channel');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // 4. Build query
    let query = supabase
      .from('tasks')
      .select('*')
      .eq('source_type', 'ai_generated')
      .eq('admin_approved', false)
      .order('ai_generated_at', { ascending: false });

    if (channel) {
      query = query.eq('channel', channel);
    }

    // 5. Apply pagination
    query = query.range(offset, offset + limit - 1);

    // 6. Execute query
    const { data, error, count } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch tasks', details: error.message },
        { status: 500 }
      );
    }

    // 7. Return tasks with metadata
    return NextResponse.json(
      {
        tasks: data,
        pagination: {
          offset,
          limit,
          total: count || 0,
          hasMore: (offset + limit) < (count || 0),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/marketplace-intel/tasks error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
