import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createSupabaseServerClient } from '@lib/supabase';

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
      const { task_id, file_url, link_url, comment, evidence_type } = body;

      if (!task_id || (!file_url && !link_url)) {
        return Response.json({ data: null, error: 'task_id e file_url ou link_url são obrigatórios' }, { status: 400 });
      }

      const supabase = createSupabaseServerClient(session.accessToken);

      if (!supabase) {
        return Response.json({ data: null }, { status: 201 });
      }

      const { data, error } = await supabase
        .from('evidence')
        .insert({
          task_id,
          submitted_by: session.user.id,
          evidence_type: evidence_type || (file_url ? 'file' : 'link'),
          file_url: file_url || null,
          link_url: link_url || null,
          comment: comment || null,
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
        .select('id, task_id, file_url, link_url, comment, submitted_by, submitted_at, evidence_type')
        .eq('task_id', taskId)
        .order('submitted_at', { ascending: false });

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
