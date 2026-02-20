import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest } from 'next/server';

// In-memory task storage (until Supabase is integrated)
let tasks = [
  {
    id: '1',
    title: 'Implementar autenticação',
    description: 'Configurar NextAuth com Supabase',
    status: 'in_progress',
    priority: 'high',
    due_date: '2026-02-25',
    assigned_to: '1',
    created_by: 'admin',
    created_at: '2026-02-18T10:00:00Z',
    updated_at: '2026-02-18T14:30:00Z',
  },
  {
    id: '2',
    title: 'Criar design system',
    description: 'Componentes reutilizáveis',
    status: 'pending',
    priority: 'medium',
    due_date: '2026-02-22',
    assigned_to: '2',
    created_by: 'admin',
    created_at: '2026-02-18T10:00:00Z',
    updated_at: '2026-02-18T10:00:00Z',
  },
  {
    id: '3',
    title: 'Corrigir bugs de performance',
    description: 'Otimizar queries',
    status: 'approved',
    priority: 'high',
    due_date: '2026-02-20',
    assigned_to: '1',
    created_by: 'admin',
    created_at: '2026-02-16T10:00:00Z',
    updated_at: '2026-02-17T15:20:00Z',
  },
  {
    id: '4',
    title: 'Documentar API',
    description: 'Criar documentação completa das APIs',
    status: 'in_progress',
    priority: 'medium',
    due_date: '2026-02-28',
    assigned_to: '1',
    created_by: 'admin',
    created_at: '2026-02-15T10:00:00Z',
    updated_at: '2026-02-18T11:45:00Z',
  },
  {
    id: '5',
    title: 'Integrar Supabase',
    description: 'Conectar aplicação ao banco de dados',
    status: 'pending',
    priority: 'high',
    due_date: '2026-03-05',
    assigned_to: '1',
    created_by: 'admin',
    created_at: '2026-02-18T10:00:00Z',
    updated_at: '2026-02-18T10:00:00Z',
  },
];

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

    // 3. Extrair query params
    const searchParams = request.nextUrl.searchParams;
    const assignedTo = searchParams.get('assigned_to');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const sortBy = searchParams.get('sort_by') || 'updated_at';

    // 4. Filtrar por assigned_to
    let filteredTasks = tasks;
    if (assignedTo) {
      filteredTasks = tasks.filter(task => task.assigned_to === assignedTo);
    }

    // 5. Ordenar
    if (sortBy === 'updated_at') {
      filteredTasks.sort((a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    }

    // 6. Aplicar limit
    const paginatedTasks = filteredTasks.slice(0, limit);

    return Response.json({
      data: paginatedTasks,
      pagination: {
        total: filteredTasks.length,
        limit,
        offset: 0,
      },
    });
  } catch (err) {
    console.error('Erro na API:', err);
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

    // 3. Parse request body
    const body = await request.json();
    const { title, description, priority, due_date, assigned_to } = body;

    // 4. Validar campos obrigatórios
    if (!title) {
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

    // 5. Gerar novo task
    const newTask = {
      id: String(Math.max(...tasks.map(t => parseInt(t.id)), 0) + 1),
      title: title.trim(),
      description: description?.trim() || '',
      status: 'pending',
      priority,
      due_date: due_date || null,
      assigned_to: assigned_to || null,
      created_by: session.user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 6. Salvar na memória (até Supabase estar configurado)
    tasks.push(newTask);

    return Response.json(newTask, { status: 201 });
  } catch (err) {
    console.error('Erro na API POST:', err);
    return Response.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
