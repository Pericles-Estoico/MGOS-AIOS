import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json(
        { error: 'Unauthorized - please log in' },
        { status: 401 }
      );
    }

    // 2. Return fake data (until Supabase is configured)
    const fakeTasks = [
      {
        id: '1',
        title: 'Implementar autenticação',
        description: 'Setup NextAuth com Supabase',
        status: 'in-progress',
        priority: 'high',
        due_date: '2026-02-25',
        assigned_to: 'john',
        created_by: 'admin',
        created_at: '2026-02-18T10:00:00Z',
        updated_at: '2026-02-18T10:00:00Z',
      },
      {
        id: '2',
        title: 'Criar design system',
        description: 'Componentes reutilizáveis',
        status: 'pending',
        priority: 'medium',
        due_date: '2026-02-22',
        assigned_to: 'uma',
        created_by: 'admin',
        created_at: '2026-02-18T10:00:00Z',
        updated_at: '2026-02-18T10:00:00Z',
      },
      {
        id: '3',
        title: 'Corrigir bugs de performance',
        description: 'Otimizar queries',
        status: 'review',
        priority: 'urgent',
        due_date: '2026-02-20',
        assigned_to: 'dex',
        created_by: 'admin',
        created_at: '2026-02-18T10:00:00Z',
        updated_at: '2026-02-18T10:00:00Z',
      },
    ];

    return Response.json({
      data: fakeTasks,
      pagination: {
        total: fakeTasks.length,
        limit: 20,
        offset: 0,
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
