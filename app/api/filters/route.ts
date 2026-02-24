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

export async function GET(request: Request) {
  try {
    const session = (await getServerSession(authOptions)) as SessionWithAccessToken;
    if (!session?.user?.id) {
      return Response.json({ data: [] });
    }

    try {
      const { searchParams } = new URL(request.url);
      const includeShared = searchParams.get('include_shared') === 'true';

      const supabase = createSupabaseServerClient(session.accessToken);
      if (!supabase) {
        return Response.json({ data: [] });
      }

      let query = supabase
        .from('saved_filters')
        .select('*')
        .eq('user_id', session.user.id)
        .order('is_default', { ascending: false })
        .order('updated_at', { ascending: false });

      if (includeShared) {
        query = supabase
          .from('saved_filters')
          .select('*')
          .or(`user_id.eq.${session.user.id},is_shared.eq.true`)
          .order('is_default', { ascending: false })
          .order('updated_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase error:', error);
        return Response.json({ data: [] });
      }

      return Response.json({ data: data || [] });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return Response.json({ data: [] });
    }
  } catch (error) {
    console.error('Error fetching filters:', error);
    return Response.json({ data: [] });
  }
}

export async function POST(request: Request) {
  try {
    const session = (await getServerSession(authOptions)) as SessionWithAccessToken;
    if (!session?.user?.id) {
      return Response.json({ data: null }, { status: 201 });
    }

    try {
      const body = await request.json();
      const { name, description, filters, is_shared, is_default } = body;

      if (!name || !filters) {
        return Response.json({ data: null }, { status: 201 });
      }

      const supabase = createSupabaseServerClient(session.accessToken);
      if (!supabase) {
        return Response.json({ data: null }, { status: 201 });
      }

      // If setting as default, unset other defaults
      if (is_default) {
        await supabase
          .from('saved_filters')
          .update({ is_default: false })
          .eq('user_id', session.user.id);
      }

      const { data, error } = await supabase
        .from('saved_filters')
        .insert({
          user_id: session.user.id,
          name,
          description,
          filters,
          is_shared: is_shared || false,
          is_default: is_default || false,
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
  } catch (error) {
    console.error('Error creating filter:', error);
    return Response.json({ data: null }, { status: 201 });
  }
}
