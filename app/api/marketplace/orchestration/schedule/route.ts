/**
 * NEXO Autonomous Schedule Endpoint
 * POST /api/marketplace/orchestration/schedule
 *
 * Endpoint para execução autônoma do NEXO via cron ou chamada programática.
 * Protegido por CRON_SECRET para evitar execução não autorizada.
 *
 * Configure no Vercel Cron Jobs (vercel.json):
 * { "crons": [{ "path": "/api/marketplace/orchestration/schedule", "schedule": "0 8 * * *" }] }
 *
 * Ou chame manualmente via POST com Authorization: Bearer {CRON_SECRET}
 */

import { NextRequest, NextResponse } from 'next/server';
import { runAutonomousLoop, generateLoopSummary } from '@lib/ai/agent-loop';

export async function POST(request: NextRequest) {
  // Verifica autorização via secret (para cron jobs e chamadas internas)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Se CRON_SECRET está definido, exige autenticação
  if (cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const body = await request.json().catch(() => ({}));
    const channels: string[] = body.channels || [];

    console.log(`⏰ [Schedule] Executando NEXO loop autônomo...`);
    const result = await runAutonomousLoop(channels);
    const summary = generateLoopSummary(result);

    return NextResponse.json({
      success: result.success,
      summary,
      result,
      message: result.success
        ? `✅ ${result.totalTasks} tarefas geradas — aguardando aprovação humana`
        : `❌ Loop falhou: ${result.error}`,
    }, { status: result.success ? 200 : 500 });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[Schedule] Erro:', errMsg);
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    description: 'NEXO Autonomous Schedule Endpoint',
    usage: 'POST /api/marketplace/orchestration/schedule',
    auth: 'Authorization: Bearer {CRON_SECRET}',
    body: { channels: ['amazon', 'shopee'] },
    cron_config: {
      vercel: '0 8 * * *',
      description: 'Executa diariamente às 8h gerando tarefas para todos os marketplaces',
    },
  });
}
