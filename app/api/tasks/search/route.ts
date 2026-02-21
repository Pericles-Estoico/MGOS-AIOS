import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-mock';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 50;
    const offset = (page - 1) * limit;

    // Get filter parameters
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const executor = searchParams.get('executor');
    const dueDateFrom = searchParams.get('due_date_from');
    const dueDateTo = searchParams.get('due_date_to');
    const sprint = searchParams.get('sprint');

    const supabase = createSupabaseServerClient((session as any).accessToken);
    if (!supabase) {
      return Response.json(
        { error: 'Database connection not available' },
        { status: 503 }
      );
    }

    // Build search query
    let query = supabase
      .from('tasks')
      .select(
        `
        id,
        title,
        description,
        status,
        priority,
        assigned_to,
        due_date,
        created_at,
        users:assigned_to(name, email)
        `,
        { count: 'exact' }
      );

    // Add full-text search if query provided
    if (q.trim()) {
      // Escape single quotes in search query
      const escapedQ = q.replace(/'/g, "''");
      query = query.or(
        `title.ilike.%${escapedQ}%,description.ilike.%${escapedQ}%`
      );
    }

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (priority && priority !== 'all') {
      query = query.eq('priority', priority);
    }

    if (executor) {
      query = query.eq('assigned_to', executor);
    }

    if (dueDateFrom) {
      query = query.gte('due_date', dueDateFrom);
    }

    if (dueDateTo) {
      query = query.lte('due_date', dueDateTo);
    }

    if (sprint) {
      query = query.eq('sprint_id', sprint);
    }

    // Execute search
    const { data: results, error: searchError, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (searchError) {
      throw searchError;
    }

    // Log search analytics (non-blocking)
    const startTime = Date.now();
    try {
      await supabase
        .from('search_analytics')
        .insert({
          user_id: session.user.id,
          search_query: q.trim(),
          result_count: count || 0,
          filters: {
            status,
            priority,
            executor,
            dueDateFrom,
            dueDateTo,
            sprint,
          },
          execution_time_ms: Date.now() - startTime,
        });
    } catch (analyticsError) {
      // Don't fail the request if analytics logging fails
      console.error('Failed to log search analytics:', analyticsError);
    }

    return Response.json({
      data: results,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Search error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
