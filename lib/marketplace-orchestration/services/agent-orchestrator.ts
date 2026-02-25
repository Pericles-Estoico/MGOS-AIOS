/**
 * NEXO - Marketplace Master Orchestrator
 * Gerencia todos os 6 agentes especializados (Alex, Marina, Sunny, Tren, Viral, Premium)
 * Gera tarefas de escala de vendas e produtos, envia para aprovação humana
 */

import { createSupabaseServerClient } from '@lib/supabase';
import { callAgent } from '@lib/ai/agent-client';
import { getAgentPrompt, getAgentName, type AgentRole } from '@lib/ai/agent-prompts';

export interface AgentStatus {
  agentId: AgentRole;
  agentName: string;
  channel: string;
  status: 'active' | 'idle' | 'error';
  tasksGenerated: number;
  tasksApproved: number;
  tasksCompleted: number;
  errorCount: number;
  lastExecuted: string | null;
  successRate: number;
}

export interface OrchestrationPlan {
  planId: string;
  timestamp: string;
  orchestrator: 'nexo';
  channels: string[];
  agentsInvolved: AgentRole[];
  totalTasksGenerated: number;
  totalTasksApproved: number;
  executionStrategy: string;
  status: 'planning' | 'executing' | 'completed' | 'failed';
  result?: {
    successCount: number;
    failureCount: number;
    summary: string;
  };
}

const CHANNEL_MAP: Record<AgentRole, string> = {
  alex: 'amazon',
  marina: 'mercadolivre',
  sunny: 'shopee',
  tren: 'shein',
  viral: 'tiktokshop',
  premium: 'kaway',
  nexo: 'general',
};

export class AgentOrchestrator {
  private agents: AgentRole[] = ['alex', 'marina', 'sunny', 'tren', 'viral', 'premium'];
  private supabase = createSupabaseServerClient();

  /**
   * NEXO ativa todos os agentes e gera tarefas para aprovação humana
   */
  async activateOrchestation(channels: string[] = []): Promise<OrchestrationPlan> {
    const planId = `plan-${Date.now()}`;
    const activeChannels = channels.length > 0
      ? channels
      : ['amazon', 'mercadolivre', 'shopee', 'shein', 'tiktokshop', 'kaway'];

    const plan: OrchestrationPlan = {
      planId,
      timestamp: new Date().toISOString(),
      orchestrator: 'nexo',
      channels: activeChannels,
      agentsInvolved: this.agents,
      totalTasksGenerated: 0,
      totalTasksApproved: 0,
      executionStrategy: 'multi-channel-synchronized',
      status: 'planning',
    };

    console.log(`🌐 NEXO: Iniciando orquestração ${planId}`);
    console.log(`📍 Canais: ${activeChannels.join(', ')}`);

    let successCount = 0;
    let failureCount = 0;

    for (const agent of this.agents) {
      const agentChannel = CHANNEL_MAP[agent];

      // Pula agentes cujo canal não está na lista solicitada
      if (channels.length > 0 && !channels.includes(agentChannel)) {
        continue;
      }

      try {
        const agentName = getAgentName(agent);
        console.log(`\n🔄 Ativando ${agentName} (${agentChannel})...`);

        const agentPrompt = getAgentPrompt(agent);
        const response = await callAgent({
          systemPrompt: agentPrompt,
          userMessage: this.buildTaskGenerationPrompt(agentName, agentChannel),
          provider: 'openai',
          maxTokens: 2000,
        });

        const tasks = this.parseAgentTasks(response.content, agent);
        plan.totalTasksGenerated += tasks.length;
        console.log(`✅ ${agentName}: ${tasks.length} tarefas geradas`);
        successCount++;

        if (tasks.length > 0) {
          await this.saveTasksToDatabase(tasks, planId, agent);
        }
      } catch (error) {
        console.error(`❌ Erro ao ativar agente ${agent}:`, error);
        failureCount++;
      }
    }

    plan.status = 'executing';
    plan.result = {
      successCount,
      failureCount,
      summary: `Orquestração concluída: ${successCount} agentes com sucesso, ${failureCount} falhas. ${plan.totalTasksGenerated} tarefas aguardando sua aprovação.`,
    };

    console.log(`\n✅ Orquestração ${planId} concluída! ${plan.totalTasksGenerated} tarefas geradas.`);
    return plan;
  }

  /**
   * Prompt explícito pedindo JSON estruturado para geração de tarefas
   */
  private buildTaskGenerationPrompt(agentName: string, channel: string): string {
    return `Como ${agentName}, especialista em ${channel} para moda bebê/infantil (0-14 anos no Brasil), gere 4 tarefas prioritárias de escala de vendas e produtos.

IMPORTANTE: Responda APENAS com um array JSON válido, sem texto adicional antes ou depois.

Formato obrigatório:
[
  {
    "title": "Título curto e claro da tarefa (máx 100 chars)",
    "description": "Descrição detalhada do que fazer, por que e qual impacto esperado nas vendas",
    "category": "scaling",
    "priority": "high",
    "estimatedHours": 4,
    "tags": ["tag1", "tag2"]
  }
]

Categorias válidas: "optimization", "best-practice", "scaling", "analysis"
Prioridades válidas: "high", "medium", "low"
estimatedHours: número de 1 a 40

Foque em tarefas que aumentem vendas e escala de produtos em ${channel}.`;
  }

  /**
   * Parser robusto da resposta do agente - tenta múltiplas estratégias
   */
  private parseAgentTasks(content: string, agent: AgentRole) {
    const marketplace = CHANNEL_MAP[agent];
    const tasks: Array<Record<string, unknown>> = [];

    // Estratégia 1: JSON array direto
    let parsed: unknown = null;
    try {
      const arrayMatch = content.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        parsed = JSON.parse(arrayMatch[0]);
      }
    } catch {
      // tenta próxima estratégia
    }

    // Estratégia 2: Objeto com chave tasks/tarefas/items
    if (!parsed) {
      try {
        const objMatch = content.match(/\{[\s\S]*\}/);
        if (objMatch) {
          const obj = JSON.parse(objMatch[0]) as Record<string, unknown>;
          parsed = obj.tasks || obj.tarefas || obj.items || obj.data || null;
        }
      } catch {
        // tenta próxima estratégia
      }
    }

    // Estratégia 3: Extrair blocos de código JSON
    if (!parsed) {
      try {
        const codeBlock = content.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (codeBlock) {
          parsed = JSON.parse(codeBlock[1]);
        }
      } catch {
        // fallback
      }
    }

    // Processar resultado parseado
    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        if (item && typeof item === 'object' && (item as Record<string, unknown>).title) {
          const t = item as Record<string, unknown>;
          tasks.push({
            title: String(t.title).substring(0, 500),
            description: String(t.description || t.desc || 'Sem descrição').substring(0, 5000),
            category: this.sanitizeCategory(String(t.category || 'optimization')),
            marketplace,
            priority: this.sanitizePriority(String(t.priority || 'medium')),
            estimated_hours: Number(t.estimatedHours || t.estimated_hours || 4),
            tags: Array.isArray(t.tags) ? t.tags.map(String) : [],
            source_type: 'ai_generated',
            admin_approved: false,
            created_by_agent: agent,
          });
        }
      }
    }

    // Fallback: cria 1 tarefa com conteúdo do agente como contexto
    if (tasks.length === 0) {
      console.warn(`⚠️  ${agent}: não foi possível parsear JSON. Criando tarefa fallback.`);
      tasks.push({
        title: `[${getAgentName(agent)}] Análise de oportunidades em ${marketplace}`,
        description: content.substring(0, 1000),
        category: 'analysis',
        marketplace,
        priority: 'medium',
        estimated_hours: 2,
        tags: [marketplace, 'ai-fallback'],
        source_type: 'ai_generated',
        admin_approved: false,
        created_by_agent: agent,
      });
    }

    return tasks;
  }

  private sanitizeCategory(val: string): string {
    const valid = ['optimization', 'best-practice', 'scaling', 'analysis'];
    return valid.includes(val) ? val : 'optimization';
  }

  private sanitizePriority(val: string): string {
    const valid = ['high', 'medium', 'low'];
    return valid.includes(val) ? val : 'medium';
  }

  /**
   * Salva tarefas na tabela marketplace_tasks
   */
  private async saveTasksToDatabase(tasks: Array<Record<string, unknown>>, planId: string, agent: AgentRole) {
    if (!this.supabase || tasks.length === 0) return;

    const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const rows = tasks.map(task => ({
      ...task,
      status: 'pending',
      plan_id: planId,
      due_date: dueDate,
      created_at: new Date().toISOString(),
      metadata: { planId, orchestrator: 'nexo', generatedAt: new Date().toISOString() },
    }));

    const { error } = await this.supabase
      .from('marketplace_tasks')
      .insert(rows);

    if (error) {
      console.error(`❌ Erro ao salvar tarefas de ${agent}:`, error.message);
    } else {
      console.log(`💾 ${tasks.length} tarefas de ${getAgentName(agent)} salvas no banco`);
    }
  }

  /**
   * Status de todos os agentes baseado no banco de dados
   */
  async getAgentsStatus(): Promise<AgentStatus[]> {
    const statuses: AgentStatus[] = [];

    for (const agent of this.agents) {
      const agentName = getAgentName(agent);
      const channel = CHANNEL_MAP[agent];

      try {
        if (!this.supabase) {
          statuses.push(this.errorStatus(agent, agentName, channel));
          continue;
        }

        const { data: tasks, error } = await this.supabase
          .from('marketplace_tasks')
          .select('status, admin_approved, created_at')
          .eq('created_by_agent', agent);

        if (error) {
          console.error(`Erro ao buscar status de ${agentName}:`, error.message);
          statuses.push(this.errorStatus(agent, agentName, channel));
          continue;
        }

        const generated = tasks?.length || 0;
        const approved = tasks?.filter(t => t.admin_approved === true).length || 0;
        const completed = tasks?.filter(t => t.status === 'completed').length || 0;
        const lastTask = tasks?.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];

        statuses.push({
          agentId: agent,
          agentName,
          channel,
          status: generated > 0 ? 'active' : 'idle',
          tasksGenerated: generated,
          tasksApproved: approved,
          tasksCompleted: completed,
          errorCount: 0,
          lastExecuted: lastTask?.created_at || null,
          successRate: generated > 0 ? (approved / generated) * 100 : 0,
        });
      } catch (error) {
        console.error(`Erro ao obter status de ${agentName}:`, error);
        statuses.push(this.errorStatus(agent, agentName, channel));
      }
    }

    return statuses;
  }

  private errorStatus(agent: AgentRole, agentName: string, channel: string): AgentStatus {
    return {
      agentId: agent,
      agentName,
      channel,
      status: 'error',
      tasksGenerated: 0,
      tasksApproved: 0,
      tasksCompleted: 0,
      errorCount: 1,
      lastExecuted: null,
      successRate: 0,
    };
  }

  /**
   * Delega tarefa específica para um agente
   */
  async delegateTask(agentId: AgentRole, taskDescription: string): Promise<string> {
    const agentName = getAgentName(agentId);
    console.log(`🎯 NEXO delegando para ${agentName}: ${taskDescription.substring(0, 50)}...`);

    const response = await callAgent({
      systemPrompt: getAgentPrompt(agentId),
      userMessage: taskDescription,
      provider: 'openai',
      maxTokens: 1000,
    });

    return response.content;
  }

  /**
   * Relatório de orquestração em markdown
   */
  async generateReport(): Promise<string> {
    const statuses = await this.getAgentsStatus();
    const totalGenerated = statuses.reduce((s, a) => s + a.tasksGenerated, 0);
    const totalApproved = statuses.reduce((s, a) => s + a.tasksApproved, 0);
    const totalCompleted = statuses.reduce((s, a) => s + a.tasksCompleted, 0);

    const lines = [
      '## 🌐 RELATÓRIO NEXO MASTER ORCHESTRATOR',
      `**Data:** ${new Date().toLocaleString('pt-BR')}`,
      '',
      '### 👥 Status dos Agentes:',
      '',
    ];

    for (const s of statuses) {
      const icon = s.status === 'active' ? '✅' : s.status === 'error' ? '❌' : '⏸️';
      lines.push(`${icon} **${s.agentName}** (${s.channel})`);
      lines.push(`   - Geradas: ${s.tasksGenerated} | Aprovadas: ${s.tasksApproved} | Concluídas: ${s.tasksCompleted}`);
      lines.push(`   - Taxa de aprovação: ${s.successRate.toFixed(1)}%`);
      lines.push('');
    }

    lines.push('### 📊 Totais:');
    lines.push(`- Tarefas geradas: **${totalGenerated}**`);
    lines.push(`- Tarefas aprovadas: **${totalApproved}**`);
    lines.push(`- Tarefas concluídas: **${totalCompleted}**`);
    lines.push(`- Taxa geral de aprovação: **${totalGenerated > 0 ? ((totalApproved / totalGenerated) * 100).toFixed(1) : 0}%**`);

    return lines.join('\n');
  }
}

export const nexoOrchestrator = new AgentOrchestrator();
