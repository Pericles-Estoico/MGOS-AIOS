import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin can list users
    if (session.user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = Math.min(
      parseInt(url.searchParams.get('limit') || '10', 10),
      50
    );
    const sortBy = url.searchParams.get('sort_by') || 'created_at';
    const filterRole = url.searchParams.get('filter_role');
    const filterStatus = url.searchParams.get('filter_status');
    const searchQuery = url.searchParams.get('search');

    const supabase = createSupabaseServerClient(session.accessToken);
    if (!supabase) {
      return Response.json(
        { error: 'Database connection not available' },
        { status: 503 }
      );
    }

    // Build base query
    let query = supabase
      .from('users')
      .select('id, name, email, role, status, created_at, updated_at', {
        count: 'exact',
      });

    // Apply filters
    if (filterRole) {
      query = query.eq('role', filterRole);
    }

    if (filterStatus) {
      query = query.eq('status', filterStatus);
    }

    if (searchQuery) {
      query = query.or(
        `name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`
      );
    }

    // Apply sorting (allow: name, email, role, created_at)
    const validSortFields = ['name', 'email', 'role', 'created_at'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    query = query.order(sortField, { ascending: true });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return Response.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return Response.json({
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: totalPages,
      },
    });
  } catch (err) {
    console.error('API error:', err);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin can create users
    if (session.user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, role } = body;

    // Validate required fields
    if (!name || !email || !role) {
      return Response.json(
        { error: 'name, email, and role are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Response.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['executor', 'head', 'admin', 'qa'];
    if (!validRoles.includes(role)) {
      return Response.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient(session.accessToken);
    if (!supabase) {
      return Response.json(
        { error: 'Database connection not available' },
        { status: 503 }
      );
    }

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return Response.json(
        { error: 'Email already exists' },
        { status: 409 }
      );
    }

    // Insert user record
    // TODO: In production, use Supabase Auth for password management and send welcome email
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        name,
        email,
        role,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return Response.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Create audit log
    await supabase.from('audit_logs').insert({
      table_name: 'users',
      record_id: newUser.id,
      operation: 'create_user',
      new_value: { name, email, role },
      created_by: session.user.id,
    });

    return Response.json(newUser, { status: 201 });
  } catch (err) {
    console.error('API error:', err);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
