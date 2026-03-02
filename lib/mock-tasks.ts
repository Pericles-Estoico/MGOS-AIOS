// Mock data for development/testing when Supabase is not available

// ID do Pericles (sua conta)
const PERICLES_ID = '11111111-1111-1111-1111-111111111111';

export const MOCK_TASKS = [
  {
    id: '1',
    title: 'Implementar autenticação',
    description: 'Adicionar NextAuth.js ao projeto',
    status: 'em_progresso',
    priority: 'high',
    assigned_to: PERICLES_ID,
    created_by: PERICLES_ID,
    created_at: '2024-02-01T10:00:00Z',
    updated_at: '2024-02-28T14:30:00Z',
    due_date: '2024-03-10T23:59:59Z',
  },
  {
    id: '2',
    title: 'Corrigir bugs de performance',
    description: 'Otimizar queries do banco de dados',
    status: 'aprovado',
    priority: 'high',
    assigned_to: PERICLES_ID,
    created_by: PERICLES_ID,
    created_at: '2024-02-05T09:15:00Z',
    updated_at: '2024-02-25T11:45:00Z',
    due_date: '2024-03-05T23:59:59Z',
  },
  {
    id: '3',
    title: 'Documentar API',
    description: 'Criar documentação completa da API REST',
    status: 'em_progresso',
    priority: 'medium',
    assigned_to: PERICLES_ID,
    created_by: PERICLES_ID,
    created_at: '2024-02-10T13:20:00Z',
    updated_at: '2024-02-28T09:30:00Z',
    due_date: '2024-03-15T23:59:59Z',
  },
  {
    id: '4',
    title: 'Integrar Supabase',
    description: 'Conectar banco de dados Supabase ao projeto',
    status: 'pendente',
    priority: 'high',
    assigned_to: PERICLES_ID,
    created_by: PERICLES_ID,
    created_at: '2024-02-15T15:45:00Z',
    updated_at: '2024-02-28T10:00:00Z',
    due_date: '2024-03-20T23:59:59Z',
  },
  {
    id: '5',
    title: 'Setup de CI/CD',
    description: 'Configurar GitHub Actions para deploy automático',
    status: 'a_fazer',
    priority: 'medium',
    assigned_to: PERICLES_ID,
    created_by: PERICLES_ID,
    created_at: '2024-02-20T08:00:00Z',
    updated_at: '2024-02-28T16:20:00Z',
    due_date: '2024-03-25T23:59:59Z',
  },
  {
    id: '6',
    title: 'Testes unitários',
    description: 'Implementar testes para todos os componentes',
    status: 'em_progresso',
    priority: 'medium',
    assigned_to: PERICLES_ID,
    created_by: PERICLES_ID,
    created_at: '2024-02-22T11:30:00Z',
    updated_at: '2024-02-28T14:15:00Z',
    due_date: '2024-03-30T23:59:59Z',
  },
  {
    id: '7',
    title: 'Design UI/UX',
    description: 'Criar mockups e wireframes do dashboard',
    status: 'completado',
    priority: 'medium',
    assigned_to: PERICLES_ID,
    created_by: PERICLES_ID,
    created_at: '2024-01-15T09:00:00Z',
    updated_at: '2024-02-10T17:45:00Z',
    due_date: '2024-02-20T23:59:59Z',
  },
  {
    id: '8',
    title: 'Implementar marketplace sync',
    description: 'Sincronizar listagens com Shopee, Shein e Mercado Livre',
    status: 'em_progresso',
    priority: 'high',
    assigned_to: PERICLES_ID,
    created_by: PERICLES_ID,
    created_at: '2024-02-18T14:00:00Z',
    updated_at: '2024-02-28T13:30:00Z',
    due_date: '2024-04-15T23:59:59Z',
  },
  {
    id: '9',
    title: 'Miniatto Baby - Otimizar categoria de camisetas',
    description: 'Reposicionar camisetas no portfólio - maior margem',
    status: 'em_progresso',
    priority: 'high',
    assigned_to: PERICLES_ID,
    created_by: PERICLES_ID,
    created_at: '2024-02-24T10:00:00Z',
    updated_at: '2024-02-28T15:00:00Z',
    due_date: '2024-03-05T23:59:59Z',
  },
  {
    id: '10',
    title: 'Analisar Heijunka para produção',
    description: 'Aplicar técnica de nivelamento de carga na fabrica',
    status: 'a_fazer',
    priority: 'high',
    assigned_to: PERICLES_ID,
    created_by: PERICLES_ID,
    created_at: '2024-02-26T14:30:00Z',
    updated_at: '2024-02-28T16:45:00Z',
    due_date: '2024-03-10T23:59:59Z',
  },
  {
    id: '11',
    title: 'GEO - Otimizar conteúdo para Claude/ChatGPT',
    description: 'Implementar schema markup e otimizar para AI search engines',
    status: 'em_progresso',
    priority: 'high',
    assigned_to: PERICLES_ID,
    created_by: PERICLES_ID,
    created_at: '2024-02-21T09:00:00Z',
    updated_at: '2024-02-28T14:00:00Z',
    due_date: '2024-03-15T23:59:59Z',
  },
];

export function getMockTasksByAssignee(assigneeId: string) {
  return MOCK_TASKS.filter((task) => task.assigned_to === assigneeId);
}

export function getMockTasksByStatus(status: string) {
  return MOCK_TASKS.filter((task) => task.status === status);
}

export function getTaskStats(tasks = MOCK_TASKS) {
  return {
    total: tasks.length,
    completado: tasks.filter((t) => t.status === 'completado').length,
    em_progresso: tasks.filter((t) => t.status === 'em_progresso').length,
    pendente: tasks.filter((t) => t.status === 'pendente').length,
    a_fazer: tasks.filter((t) => t.status === 'a_fazer').length,
    aprovado: tasks.filter((t) => t.status === 'aprovado').length,
  };
}
