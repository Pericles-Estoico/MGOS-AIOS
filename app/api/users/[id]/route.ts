import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin can view user details
    if (session.user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const supabase = createSupabaseServerClient(session.accessToken);

    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, role, status, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error || !user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    return Response.json(user);
  } catch (err) {
    console.error('API error:', err);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin can update users
    if (session.user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, email, role, status } = body;

    const supabase = createSupabaseServerClient(session.accessToken);

    // Get current user data
    const { data: currentUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !currentUser) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent changing own admin status
    if (id === session.user.id && role && role !== session.user.role) {
      return Response.json(
        { error: 'Cannot change your own role' },
        { status: 400 }
      );
    }

    // Validate email if provided
    if (email && email !== currentUser.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return Response.json(
          { error: 'Invalid email format' },
          { status: 400 }
        );
      }

      // Check if new email is unique
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .neq('id', id)
        .single();

      if (existingUser) {
        return Response.json(
          { error: 'Email already in use' },
          { status: 409 }
        );
      }
    }

    // Validate role if provided
    if (role) {
      const validRoles = ['executor', 'head', 'admin', 'qa'];
      if (!validRoles.includes(role)) {
        return Response.json(
          { error: 'Invalid role' },
          { status: 400 }
        );
      }
    }

    // Build update object (only include provided fields)
    const updateData: Record<string, string> = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (status !== undefined) updateData.status = status;
    updateData.updated_at = new Date().toISOString();

    // Update user
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Supabase error:', updateError);
      return Response.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }

    // Create audit log
    await supabase.from('audit_logs').insert({
      table_name: 'users',
      record_id: id,
      operation: 'update_user',
      old_value: currentUser,
      new_value: updateData,
      created_by: session.user.id,
    });

    return Response.json(updatedUser);
  } catch (err) {
    console.error('API error:', err);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin can delete users
    if (session.user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    // Prevent self-deletion
    if (id === session.user.id) {
      return Response.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient(session.accessToken);

    // Get user to check role
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('role')
      .eq('id', id)
      .single();

    if (fetchError || !user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent deletion of last admin
    if (user.role === 'admin') {
      const { count: adminCount } = await supabase
        .from('users')
        .select('id', { count: 'exact' })
        .eq('role', 'admin');

      if (adminCount === 1) {
        return Response.json(
          { error: 'Cannot delete the last admin user' },
          { status: 400 }
        );
      }
    }

    // Check for pending tasks (warning, not blocking)
    const { count: pendingTasks } = await supabase
      .from('tasks')
      .select('id', { count: 'exact' })
      .eq('assigned_to', id)
      .in('status', ['pending', 'in_progress']);

    // Delete user
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Supabase error:', deleteError);
      return Response.json(
        { error: 'Failed to delete user' },
        { status: 500 }
      );
    }

    // Create audit log
    await supabase.from('audit_logs').insert({
      table_name: 'users',
      record_id: id,
      operation: 'delete_user',
      old_value: { user_id: id },
      new_value: null,
      created_by: session.user.id,
    });

    return Response.json({
      success: true,
      message: 'User deleted successfully',
      warning: pendingTasks && pendingTasks > 0
        ? `User had ${pendingTasks} pending tasks`
        : null,
    });
  } catch (err) {
    console.error('API error:', err);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
