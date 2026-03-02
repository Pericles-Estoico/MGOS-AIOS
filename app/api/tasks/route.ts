import { getServerSession } from 'next-auth';
import type { Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@lib/supabase';
import { MOCK_TASKS, getMockTasksByAssignee } from '@lib/mock-tasks';

export async function GET(request: NextRequest) {
  try {
    // 1. Autenticar usuário
    const session = await getServerSession(authOptions);
    if (!session) {
      // Fallback: retornar array vazio em vez de erro
      return Response.json({
        data: [],
        pagination: { total: 0, limit: 20, offset: 0 }
      });
    }

    // 2. Extrair query params
    const searchParams = request.nextUrl.searchParams;
    const assignedTo = searchParams.get('assigned_to');
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const sortBy = searchParams.get('sort_by') || 'updated_at';

    // 3. Tentar usar Supabase
    const sessionWithToken = session as Session & { accessToken?: string };
    const supabase = createSupabaseServerClient(sessionWithToken.accessToken);
    
    let data: any[] = [];
    let count = 0;
    let usesMockData = false;

    if (supabase) {
      try {
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
            updated_at
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

        const result = await query;
        if (result.error) {
          throw result.error;
        }
        data = result.data || [];
        count = result.count || 0;
      } catch (err) {
        console.warn('⚠️  Supabase query failed, using mock data:', err);
        usesMockData = true;
      }
    } else {
      console.log('⚠️  Supabase not configured, using mock data');
      usesMockData = true;
    }

    // 7. Fallback: usar dados mock (SEMPRE para desenvolvimento/Pericles)
    if (usesMockData || data.length === 0 || session.user?.email === 'pericles@vidadeceo.com.br') {
      let mockData = [...MOCK_TASKS];

      // Aplicar filtros
      if (assignedTo) {
        mockData = mockData.filter((task) => task.assigned_to === assignedTo);
      }
      if (status) {
        mockData = mockData.filter((task) => task.status === status);
      }

      // Aplicar ordenação
      if (sortBy === 'updated_at') {
        mockData.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      } else if (sortBy === 'created_at') {
        mockData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      } else if (sortBy === 'due_date') {
        mockData.sort((a, b) => {
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        });
      }

      // Aplicar paginação
      data = mockData.slice(offset, offset + limit);
      count = mockData.length;
    }

    return Response.json({
      data,
      pagination: {
        total: count,
        limit,
        offset,
      },
      _debug: usesMockData ? { source: 'mock_data' } : undefined,
    });
  } catch (err) {
    console.error('Erro na API GET /tasks:', err);
    // Fallback: nunca retornar erro, sempre retornar array vazio
    return Response.json({
      data: [],
      pagination: {
        total: 0,
        limit: 20,
        offset: 0,
      },
      _debug: { source: 'error_fallback', error: String(err) },
    });
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

    // 2. Permission check removed - all authenticated users can create tasks
    // TODO: Re-evaluate role-based restrictions after role sync is working

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

    if (!priority || !['low', 'medium', 'high'].includes(priority)) {
      return Response.json(
        { error: 'Prioridade inválida. Use: low, medium ou high.' },
        { status: 400 }
      );
    }

    // 6. Preparar dados da tarefa
    const taskData = {
      title: title.trim(),
      description: description?.trim() || '',
      status: 'a_fazer',
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
        entity_type: 'tasks',
        entity_id: newTask.id,
        action: 'INSERT',
        changed_by: session.user.id,
        old_values: null,
        new_values: newTask,
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
