/**
 * Agent Loop - Loop autônomo do NEXO
 * Executa orquestração de todos os agentes e retorna resumo
 *
 * Exports públicos:
 * - runAutonomousLoop()       → executa todos os agentes NEXO
 * - generateLoopSummary()     → resumo em markdown do resultado
 * - runAnalysisPlan()         → alias para análise via orquestração
 * - runAnalysisPlanWithContext() → análise com contexto adicional
 * - createPhase1Tasks()       → cria tarefas da fase 1 (aliases de orquestração)
 */

import { nexoOrchestrator, type OrchestrationPlan } from '@lib/marketplace-orchestration/services/agent-orchestrator';

export interface LoopResult {
  success: boolean;
  planId: string;
  totalTasks: number;
  agentsActivated: number;
  agentsFailed: number;
  timestamp: string;
  plan: OrchestrationPlan;
  error?: string;
}

/**
 * Executa o loop autônomo completo do NEXO:
 * 1. Ativa todos os 6 agentes
 * 2. Cada agente gera tarefas de escala de vendas
 * 3. Tarefas são salvas com status 'pending' aguardando aprovação humana
 */
export async function runAutonomousLoop(channels: string[] = []): Promise<LoopResult> {
  const timestamp = new Date().toISOString();

  try {
    console.log(`🤖 [Agent Loop] Iniciando loop autônomo em ${timestamp}`);

    const plan = await nexoOrchestrator.activateOrchestation(channels);

    const result: LoopResult = {
      success: plan.status !== 'failed',
      planId: plan.planId,
      totalTasks: plan.totalTasksGenerated,
      agentsActivated: plan.result?.successCount || 0,
      agentsFailed: plan.result?.failureCount || 0,
      timestamp,
      plan,
    };

    console.log(`✅ [Agent Loop] Concluído: ${result.totalTasks} tarefas geradas, ${result.agentsActivated} agentes ativos`);
    return result;
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(`❌ [Agent Loop] Erro fatal:`, errMsg);

    return {
      success: false,
      planId: `plan-failed-${Date.now()}`,
      totalTasks: 0,
      agentsActivated: 0,
      agentsFailed: 6,
      timestamp,
      plan: {
        planId: `plan-failed-${Date.now()}`,
        timestamp,
        orchestrator: 'nexo',
        channels: channels.length > 0 ? channels : ['amazon', 'mercadolivre', 'shopee', 'shein', 'tiktokshop', 'kaway'],
        agentsInvolved: ['alex', 'marina', 'sunny', 'tren', 'viral', 'premium'],
        totalTasksGenerated: 0,
        totalTasksApproved: 0,
        executionStrategy: 'multi-channel-synchronized',
        status: 'failed',
        result: { successCount: 0, failureCount: 6, summary: errMsg },
      },
      error: errMsg,
    };
  }
}

/**
 * Alias: executa análise via orquestração NEXO
 * (usado por rotas de análise legacy)
 */
export async function runAnalysisPlan(channels?: string[]): Promise<LoopResult> {
  return runAutonomousLoop(channels);
}

/**
 * Alias: executa análise com contexto adicional
 */
export async function runAnalysisPlanWithContext(
  context: Record<string, unknown>,
  channels?: string[]
): Promise<LoopResult> {
  console.log('[Agent Loop] Contexto recebido:', JSON.stringify(context).substring(0, 200));
  return runAutonomousLoop(channels);
}

/**
 * Alias: cria tarefas da fase 1
 */
export async function createPhase1Tasks(channels?: string[]): Promise<LoopResult> {
  return runAutonomousLoop(channels);
}

/**
 * Gera resumo legível do resultado do loop
 */
export function generateLoopSummary(result: LoopResult): string {
  const lines = [
    `🤖 **NEXO Loop Autônomo** — ${new Date(result.timestamp).toLocaleString('pt-BR')}`,
    '',
    result.success
      ? `✅ **Sucesso** — ${result.totalTasks} tarefas geradas e aguardando sua aprovação`
      : `❌ **Falha** — ${result.error || 'Erro desconhecido'}`,
    '',
    `- Agentes ativos: ${result.agentsActivated}/6`,
    `- Agentes com falha: ${result.agentsFailed}/6`,
    `- Total de tarefas: ${result.totalTasks}`,
    `- Plan ID: \`${result.planId}\``,
    '',
    '> Acesse o painel de aprovação para revisar e aprovar as tarefas geradas.',
  ];

  return lines.join('\n');
}
