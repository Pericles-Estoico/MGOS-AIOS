import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
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
    const fakeTasks = [
      {
        id: '1',
        title: 'Implementar autenticação',
        description: 'Configurar NextAuth com Supabase',
        status: 'em-andamento',
        priority: 'alta',
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
        status: 'pendente',
        priority: 'média',
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
        status: 'revisão',
        priority: 'urgente',
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
    console.error('Erro na API:', err);
    return Response.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
