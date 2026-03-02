import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createSupabaseServerClient } from '@lib/supabase';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ data: [] });
    }

    const supabase = createSupabaseServerClient();
    if (!supabase) {
      return Response.json({ data: [] });
    }

    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar produtos:', error);
      return Response.json({ data: [] });
    }

    return Response.json({ data: data || [] });
  } catch (error) {
    console.error('Erro na API:', error);
    return Response.json({ data: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const supabase = createSupabaseServerClient();
    if (!supabase) {
      return Response.json({ error: 'Erro ao conectar' }, { status: 503 });
    }

    const body = await request.json();
    const { titulo, preco, link, marketplace, imagem, descricao } = body;

    const { data, error } = await supabase
      .from('produtos')
      .insert([
        {
          user_id: session.user.id,
          titulo,
          preco,
          link,
          marketplace,
          imagem,
          descricao,
          status: 'novo',
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Erro ao inserir:', error);
      return Response.json({ error: 'Erro ao salvar produto' }, { status: 500 });
    }

    return Response.json(data, { status: 201 });
  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ error: 'Erro interno' }, { status: 500 });
  }
}
