import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@lib/supabase';

/**
 * POST /api/marketplace/test/create-analysis
 * Endpoint de teste para criar uma análise manual (diagnóstico)
 * ⚠️ APENAS PARA DESENVOLVIMENTO - Remover em produção
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({
        error: 'Supabase not configured',
      }, { status: 500 });
    }

    // Create test analysis
    const testAnalysis = {
      title: 'Teste - Análise Manual Criada em ' + new Date().toLocaleString('pt-BR'),
      description: 'Análise de teste para diagnóstico do sistema',
      channels: ['amazon', 'shopee'],
      status: 'pending',
      plan_data: {
        summary: 'Plano estratégico de teste para validação do sistema',
        opportunities: [
          {
            id: 1,
            priority: 'alta',
            title: 'Otimizar Título do Produto',
            what: 'Atualizar título com palavras-chave de busca',
            why: 'Aumentar visibilidade nas buscas',
            how: 'Incluir "Moda Bebê" no início do título',
            agent: 'alex',
            expectedImpact: '25%',
            metric: 'Cliques e impressões',
          },
          {
            id: 2,
            priority: 'média',
            title: 'Melhorar Imagens do Produto',
            what: 'Adicionar imagens de alta qualidade',
            why: 'Aumentar taxa de conversão',
            how: 'Usar fotos em fundo branco com detalhes',
            agent: 'alex',
            expectedImpact: '15%',
            metric: 'Taxa de conversão',
          },
        ],
        phases: [
          {
            number: 1,
            name: 'Otimizações Rápidas',
            weeks: 'Semanas 1-2',
            tasks: ['Atualizar titulo', 'Revisar descrição'],
            investment: 'Equipe interna',
            expectedImpact: '15-20%',
          },
          {
            number: 2,
            name: 'Melhorias de Conteúdo',
            weeks: 'Semanas 3-4',
            tasks: ['Fotografar novamente', 'Criar vídeos'],
            investment: 'Sessão de fotos profissional',
            expectedImpact: '20-30%',
          },
        ],
        metrics: [
          {
            label: 'Visibilidade',
            baseline: '1,000 impressões/dia',
            goal: '3,000 impressões/dia',
            phase: 'Fase 1',
          },
          {
            label: 'Taxa de Conversão',
            baseline: '2%',
            goal: '4%',
            phase: 'Fase 2',
          },
        ],
      },
      created_by_agent: 'test-endpoint',
      is_scheduled: false,
      file_source: 'manual-test',
    };

    // Insert into database
    const { data, error } = await supabase
      .from('marketplace_plans')
      .insert([testAnalysis])
      .select('id, title, status, created_at')
      .single();

    if (error) {
      return NextResponse.json({
        error: 'Failed to create test analysis',
        details: error.message,
        code: error.code,
      }, { status: 500 });
    }

    return NextResponse.json({
      status: 'success',
      message: 'Teste análise criada com sucesso',
      analysis: data,
      testEndpoint: '/api/marketplace/analysis/' + data.id,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

/**
 * GET /api/marketplace/test/create-analysis
 * Mostra instruções de teste
 */
export async function GET() {
  return NextResponse.json({
    message: 'POST para criar análise de teste',
    endpoint: '/api/marketplace/test/create-analysis',
    method: 'POST',
    response: {
      status: 'success',
      analysis: {
        id: 'uuid',
        title: 'Teste - Análise...',
        status: 'pending',
      },
    },
    warning: '⚠️ Endpoint de teste apenas para desenvolvimento - remover em produção',
  });
}
