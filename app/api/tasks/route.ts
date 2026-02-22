import { getServerSession } from 'next-auth';
import type { Session } from 'next-auth';
import { authOptions } from '@/lib/auth-mock';
import { NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // 1. Autenticar usuário
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json(
        { error: 'Não autorizado - por favor, faça login' },
        { status: 401 }
      );
    }

    // 2. Criar cliente Supabase
    const sessionWithToken = session as Session & { accessToken?: string };
    const supabase = createSupabaseServerClient(sessionWithToken.accessToken);
    if (!supabase) {
      return Response.json(
        { error: 'Banco de dados não configurado' },
        { status: 503 }
      );
    }

    // 3. Extrair query params
    const searchParams = request.nextUrl.searchParams;
    const assignedTo = searchParams.get('assigned_to');
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const sortBy = searchParams.get('sort_by') || 'updated_at';

    // 4. Construir query
    let query = supabase
      .from('tasks')
      .select(
        `
        id,
        title,
        description,
        status,
        priority,
        due_date,
        assigned_to,
        created_by,
        created_at,
        updated_at,
        source_type,
        channel
        `,
        { count: 'exact' }
      );

    // 5. Aplicar filtros
    if (assignedTo) {
      query = query.eq('assigned_to', assignedTo);
    }
    if (status) {
      query = query.eq('status', status);
    }

    // 6. Ordenar e paginar
    if (sortBy === 'updated_at') {
      query = query.order('updated_at', { ascending: false });
    } else if (sortBy === 'created_at') {
      query = query.order('created_at', { ascending: false });
    } else if (sortBy === 'due_date') {
      query = query.order('due_date', { ascending: true });
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Erro ao buscar tarefas do Supabase:', error);
      return Response.json(
        { error: 'Erro ao buscar tarefas' },
        { status: 500 }
      );
    }

    return Response.json({
      data: data || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
      },
    });
  } catch (err) {
    console.error('Erro na API GET /tasks:', err);
    return Response.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Autenticar usuário
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json(
        { error: 'Não autorizado - por favor, faça login' },
        { status: 401 }
      );
    }

    // 2. Verificar permissão (apenas admin/head podem criar tarefas)
    if (!session.user.role || !['admin', 'head'].includes(session.user.role)) {
      return Response.json(
        { error: 'Apenas admin e head podem criar tarefas' },
        { status: 403 }
      );
    }

    // 3. Criar cliente Supabase
    const sessionWithToken = session as Session & { accessToken?: string };
    const supabase = createSupabaseServerClient(sessionWithToken.accessToken);
    if (!supabase) {
      return Response.json(
        { error: 'Banco de dados não configurado' },
        { status: 503 }
      );
    }

    // 4. Parse request body
    const body = await request.json();
    const { title, description, priority, due_date, assigned_to } = body;

    // 5. Validar campos obrigatórios
    if (!title || !title.trim()) {
      return Response.json(
        { error: 'Título é obrigatório' },
        { status: 400 }
      );
    }

    if (!priority || !['low', 'medium', 'high', 'critical'].includes(priority)) {
      return Response.json(
        { error: 'Prioridade inválida' },
        { status: 400 }
      );
    }

    // 6. Preparar dados da tarefa
    const taskData = {
      title: title.trim(),
      description: description?.trim() || '',
      status: 'pending',
      priority,
      due_date: due_date || null,
      assigned_to: assigned_to || null,
      created_by: session.user.id,
    };

    // 7. Inserir na tabela de tarefas
    const { data: newTask, error: insertError } = await supabase
      .from('tasks')
      .insert([taskData])
      .select()
      .single();

    if (insertError) {
      console.error('Erro ao inserir tarefa no Supabase:', insertError);
      return Response.json(
        { error: 'Erro ao criar tarefa' },
        { status: 500 }
      );
    }

    // 8. Registrar no audit log
    await supabase
      .from('audit_logs')
      .insert({
        table_name: 'tasks',
        record_id: newTask.id,
        operation: 'create',
        old_value: null,
        new_value: newTask,
        created_by: session.user.id,
      });

    return Response.json(newTask, { status: 201 });
  } catch (err) {
    console.error('Erro na API POST /tasks:', err);
    return Response.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
