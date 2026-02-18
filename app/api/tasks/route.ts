import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest } from 'next/server';

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

    // 2. Retornar dados fake (até Supabase estar configurado)
    const allTasks = [
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

    // 3. Extrair query params
    const searchParams = request.nextUrl.searchParams;
    const assignedTo = searchParams.get('assigned_to');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const sortBy = searchParams.get('sort_by') || 'updated_at';

    // 4. Filtrar por assigned_to
    let filteredTasks = allTasks;
    if (assignedTo) {
      filteredTasks = allTasks.filter(task => task.assigned_to === assignedTo);
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
