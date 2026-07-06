import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createSupabaseServerClient } from '@lib/supabase';

const FALLBACK_TEMPLATES = [
  { categoria: 'camiseta', stages: [
    { nome: 'Inventário de Insumos', ordem: 1, duracao_dias: 1 },
    { nome: 'Planejamento PCP', ordem: 2, duracao_dias: 1 },
    { nome: 'Compra/Reposição de Tecido', ordem: 3, duracao_dias: 3 },
    { nome: 'Enfestamento', ordem: 4, duracao_dias: 1 },
    { nome: 'Corte', ordem: 5, duracao_dias: 1 },
    { nome: 'Separação e Loteamento', ordem: 6, duracao_dias: 1 },
    { nome: 'Costura - Fechar Ombro', ordem: 7, duracao_dias: 1 },
    { nome: 'Costura - Mangas', ordem: 8, duracao_dias: 1 },
    { nome: 'Costura - Gola', ordem: 9, duracao_dias: 1 },
    { nome: 'Costura - Bainha', ordem: 10, duracao_dias: 1 },
    { nome: 'Controle de Qualidade', ordem: 11, duracao_dias: 1 },
    { nome: 'Passadoria', ordem: 12, duracao_dias: 1 },
    { nome: 'Etiquetagem e Embalagem', ordem: 13, duracao_dias: 1 },
    { nome: 'Cadastro no E-commerce', ordem: 14, duracao_dias: 1 },
    { nome: 'Fotos e Marketing', ordem: 15, duracao_dias: 2 },
    { nome: 'Expedição', ordem: 16, duracao_dias: 1 },
    { nome: 'Recebimento do Pagamento', ordem: 17, duracao_dias: 1 },
  ]},
  { categoria: 'calca', stages: [
    { nome: 'Inventário de Insumos', ordem: 1, duracao_dias: 1 },
    { nome: 'Planejamento PCP', ordem: 2, duracao_dias: 1 },
    { nome: 'Compra/Reposição de Tecido', ordem: 3, duracao_dias: 3 },
    { nome: 'Enfestamento', ordem: 4, duracao_dias: 1 },
    { nome: 'Corte', ordem: 5, duracao_dias: 1 },
    { nome: 'Separação e Loteamento', ordem: 6, duracao_dias: 1 },
    { nome: 'Costura - Frente e Fundo', ordem: 7, duracao_dias: 2 },
    { nome: 'Costura - Cós', ordem: 8, duracao_dias: 1 },
    { nome: 'Costura - Bolsos', ordem: 9, duracao_dias: 1 },
    { nome: 'Costura - Barra', ordem: 10, duracao_dias: 1 },
    { nome: 'Controle de Qualidade', ordem: 11, duracao_dias: 1 },
    { nome: 'Passadoria', ordem: 12, duracao_dias: 1 },
    { nome: 'Etiquetagem e Embalagem', ordem: 13, duracao_dias: 1 },
    { nome: 'Cadastro no E-commerce', ordem: 14, duracao_dias: 1 },
    { nome: 'Fotos e Marketing', ordem: 15, duracao_dias: 2 },
    { nome: 'Expedição', ordem: 16, duracao_dias: 1 },
    { nome: 'Recebimento do Pagamento', ordem: 17, duracao_dias: 1 },
  ]},
  { categoria: 'vestido', stages: [
    { nome: 'Inventário de Insumos', ordem: 1, duracao_dias: 1 },
    { nome: 'Planejamento PCP', ordem: 2, duracao_dias: 1 },
    { nome: 'Compra/Reposição de Tecido', ordem: 3, duracao_dias: 3 },
    { nome: 'Enfestamento', ordem: 4, duracao_dias: 1 },
    { nome: 'Corte', ordem: 5, duracao_dias: 1 },
    { nome: 'Separação e Loteamento', ordem: 6, duracao_dias: 1 },
    { nome: 'Costura - Corpo/Busto', ordem: 7, duracao_dias: 2 },
    { nome: 'Costura - Saia/Barra', ordem: 8, duracao_dias: 1 },
    { nome: 'Costura - Decote e Acabamentos', ordem: 9, duracao_dias: 1 },
    { nome: 'Costura - Zíper/Botões', ordem: 10, duracao_dias: 1 },
    { nome: 'Controle de Qualidade', ordem: 11, duracao_dias: 1 },
    { nome: 'Passadoria', ordem: 12, duracao_dias: 1 },
    { nome: 'Etiquetagem e Embalagem', ordem: 13, duracao_dias: 1 },
    { nome: 'Cadastro no E-commerce', ordem: 14, duracao_dias: 1 },
    { nome: 'Fotos e Marketing', ordem: 15, duracao_dias: 2 },
    { nome: 'Expedição', ordem: 16, duracao_dias: 1 },
    { nome: 'Recebimento do Pagamento', ordem: 17, duracao_dias: 1 },
  ]},
  { categoria: 'conjunto', stages: [
    { nome: 'Inventário de Insumos', ordem: 1, duracao_dias: 1 },
    { nome: 'Planejamento PCP', ordem: 2, duracao_dias: 1 },
    { nome: 'Compra/Reposição de Tecido', ordem: 3, duracao_dias: 3 },
    { nome: 'Enfestamento', ordem: 4, duracao_dias: 1 },
    { nome: 'Corte (todas as peças)', ordem: 5, duracao_dias: 2 },
    { nome: 'Separação e Loteamento', ordem: 6, duracao_dias: 1 },
    { nome: 'Costura - Peça Superior', ordem: 7, duracao_dias: 2 },
    { nome: 'Costura - Peça Inferior', ordem: 8, duracao_dias: 2 },
    { nome: 'Acabamentos Gerais', ordem: 9, duracao_dias: 1 },
    { nome: 'Controle de Qualidade', ordem: 10, duracao_dias: 1 },
    { nome: 'Passadoria', ordem: 11, duracao_dias: 1 },
    { nome: 'Etiquetagem e Embalagem', ordem: 12, duracao_dias: 1 },
    { nome: 'Cadastro no E-commerce', ordem: 13, duracao_dias: 1 },
    { nome: 'Fotos e Marketing', ordem: 14, duracao_dias: 2 },
    { nome: 'Expedição', ordem: 15, duracao_dias: 1 },
    { nome: 'Recebimento do Pagamento', ordem: 16, duracao_dias: 1 },
  ]},
  { categoria: 'moda-infantil', stages: [
    { nome: 'Inventário de Insumos', ordem: 1, duracao_dias: 1 },
    { nome: 'Planejamento PCP', ordem: 2, duracao_dias: 1 },
    { nome: 'Compra/Reposição de Tecido', ordem: 3, duracao_dias: 3 },
    { nome: 'Enfestamento', ordem: 4, duracao_dias: 1 },
    { nome: 'Corte', ordem: 5, duracao_dias: 1 },
    { nome: 'Separação e Loteamento', ordem: 6, duracao_dias: 1 },
    { nome: 'Costura - Estrutura', ordem: 7, duracao_dias: 2 },
    { nome: 'Costura - Detalhes/Apliques', ordem: 8, duracao_dias: 1 },
    { nome: 'Controle de Qualidade', ordem: 9, duracao_dias: 1 },
    { nome: 'Passadoria', ordem: 10, duracao_dias: 1 },
    { nome: 'Etiquetagem e Embalagem', ordem: 11, duracao_dias: 1 },
    { nome: 'Cadastro no E-commerce', ordem: 12, duracao_dias: 1 },
    { nome: 'Fotos e Marketing', ordem: 13, duracao_dias: 2 },
    { nome: 'Expedição', ordem: 14, duracao_dias: 1 },
    { nome: 'Recebimento do Pagamento', ordem: 15, duracao_dias: 1 },
  ]},
  { categoria: 'jaqueta', stages: [
    { nome: 'Inventário de Insumos', ordem: 1, duracao_dias: 1 },
    { nome: 'Planejamento PCP', ordem: 2, duracao_dias: 1 },
    { nome: 'Compra/Reposição de Materiais', ordem: 3, duracao_dias: 5 },
    { nome: 'Enfestamento', ordem: 4, duracao_dias: 1 },
    { nome: 'Corte', ordem: 5, duracao_dias: 2 },
    { nome: 'Separação e Loteamento', ordem: 6, duracao_dias: 1 },
    { nome: 'Costura - Estrutura/Corpo', ordem: 7, duracao_dias: 2 },
    { nome: 'Costura - Mangas', ordem: 8, duracao_dias: 2 },
    { nome: 'Costura - Forro Interno', ordem: 9, duracao_dias: 2 },
    { nome: 'Costura - Zíper/Fechamento', ordem: 10, duracao_dias: 1 },
    { nome: 'Costura - Bolsos', ordem: 11, duracao_dias: 1 },
    { nome: 'Controle de Qualidade', ordem: 12, duracao_dias: 1 },
    { nome: 'Passadoria', ordem: 13, duracao_dias: 1 },
    { nome: 'Etiquetagem e Embalagem', ordem: 14, duracao_dias: 1 },
    { nome: 'Cadastro no E-commerce', ordem: 15, duracao_dias: 1 },
    { nome: 'Fotos e Marketing', ordem: 16, duracao_dias: 2 },
    { nome: 'Expedição', ordem: 17, duracao_dias: 1 },
    { nome: 'Recebimento do Pagamento', ordem: 18, duracao_dias: 1 },
  ]},
  { categoria: 'acessorio', stages: [
    { nome: 'Inventário de Insumos', ordem: 1, duracao_dias: 1 },
    { nome: 'Planejamento PCP', ordem: 2, duracao_dias: 1 },
    { nome: 'Compra/Reposição de Materiais', ordem: 3, duracao_dias: 3 },
    { nome: 'Corte/Preparação', ordem: 4, duracao_dias: 1 },
    { nome: 'Montagem/Produção', ordem: 5, duracao_dias: 2 },
    { nome: 'Acabamentos e Detalhes', ordem: 6, duracao_dias: 1 },
    { nome: 'Controle de Qualidade', ordem: 7, duracao_dias: 1 },
    { nome: 'Embalagem', ordem: 8, duracao_dias: 1 },
    { nome: 'Cadastro no E-commerce', ordem: 9, duracao_dias: 1 },
    { nome: 'Fotos e Marketing', ordem: 10, duracao_dias: 2 },
    { nome: 'Expedição', ordem: 11, duracao_dias: 1 },
    { nome: 'Recebimento do Pagamento', ordem: 12, duracao_dias: 1 },
  ]},
];

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return Response.json({ templates: FALLBACK_TEMPLATES });
  }

  try {
    const { data, error } = await supabase
      .from('mvp_category_templates')
      .select('categoria, stages')
      .order('categoria');

    if (error || !data?.length) {
      return Response.json({ templates: FALLBACK_TEMPLATES });
    }

    return Response.json({ templates: data });
  } catch {
    return Response.json({ templates: FALLBACK_TEMPLATES });
  }
}
