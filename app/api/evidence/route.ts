import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-mock';
import { createSupabaseServerClient } from '@/lib/supabase';

interface SessionWithAccessToken {
  user?: {
    id?: string;
    email?: string;
    name?: string;
  };
  accessToken?: string;
}

export async function POST(request: Request) {
  try {
    const session = (await getServerSession(authOptions)) as unknown as SessionWithAccessToken | null;
    if (!session || !session.user?.id) {
      return Response.json({ data: null }, { status: 201 });
    }

    try {
      const body = await request.json();
      const { task_id, file_url, description } = body;

      if (!task_id || !file_url) {
        return Response.json({ data: null }, { status: 201 });
      }

      const supabase = createSupabaseServerClient(session.accessToken);

      if (!supabase) {
        return Response.json({ data: null }, { status: 201 });
      }

      const { data, error } = await supabase
        .from('evidence')
        .insert({
          task_id,
          file_url,
          description,
          created_by: session.user.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return Response.json({ data: null }, { status: 201 });
      }

      return Response.json(data, { status: 201 });
    } catch (parseError) {
      console.error('Request parsing error:', parseError);
      return Response.json({ data: null }, { status: 201 });
    }
  } catch (err) {
    console.error('API error:', err);
    return Response.json({ data: null }, { status: 201 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ data: [] });
    }

    try {
      const url = new URL(request.url);
      const taskId = url.searchParams.get('task_id');

      if (!taskId) {
        return Response.json({ data: [] });
      }

      const supabase = createSupabaseServerClient((session as SessionWithAccessToken).accessToken);

      if (!supabase) {
        return Response.json({ data: [] });
      }

      const { data, error } = await supabase
        .from('evidence')
        .select('id, task_id, file_url, description, created_by, created_at')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        return Response.json({ data: [] });
      }

      return Response.json({ data: data || [] });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return Response.json({ data: [] });
    }
  } catch (err) {
    console.error('API error:', err);
    return Response.json({ data: [] });
  }
}
