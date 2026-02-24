/**
 * NEXO - Marketplace Master Orchestrator
 * Gerencia todos os 6 agentes especializados (Alex, Marina, Sunny, Tren, Viral, Premium)
 * Indica tarefas, monitora desempenho, controla execução
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

export class AgentOrchestrator {
  private agents: AgentRole[] = ['alex', 'marina', 'sunny', 'tren', 'viral', 'premium'];
  private supabase = createSupabaseServerClient();

  /**
   * NEXO activates and coordinates all marketplace specialists
   * Returns orchestration plan with all agents' tasks
   */
  async activateOrchestation(channels: string[] = []): Promise<OrchestrationPlan> {
    const planId = `plan-${Date.now()}`;
    const plan: OrchestrationPlan = {
      planId,
      timestamp: new Date().toISOString(),
      orchestrator: 'nexo',
      channels: channels.length > 0 ? channels : ['amazon', 'mercadolivre', 'shopee', 'shein', 'tiktokshop', 'kaway'],
      agentsInvolved: this.agents,
      totalTasksGenerated: 0,
      totalTasksApproved: 0,
      executionStrategy: 'multi-channel-synchronized',
      status: 'planning',
    };

    console.log(`🌐 NEXO ORCHESTRATOR: Iniciando plano de orquestração ${planId}`);
    console.log(`📍 Canais alvo: ${plan.channels.join(', ')}`);
    console.log(`👥 Agentes ativados: ${this.agents.map(a => getAgentName(a as AgentRole)).join(', ')}`);

    try {
      // Activate each agent
      let successCount = 0;
      let failureCount = 0;

      for (const agent of this.agents) {
        try {
          const agentName = getAgentName(agent);
          console.log(`\n🔄 Ativando ${agentName}...`);

          // Get agent's channel
          const channelMap: Record<AgentRole, string> = {
            alex: 'amazon',
            marina: 'mercadolivre',
            sunny: 'shopee',
            tren: 'shein',
            viral: 'tiktokshop',
            premium: 'kaway',
            nexo: 'general',
          };

          const agentChannel = channelMap[agent];

          // Call agent for tasks generation
          const agentPrompt = getAgentPrompt(agent);
          const response = await callAgent({
            systemPrompt: agentPrompt,
            userMessage: `Como especialista em ${agentName}, analise o marketplace de ${agentChannel} e gere 3-5 tarefas prioritárias de otimização para moda bebê/infantil.`,
            provider: 'openai',
            maxTokens: 1500,
          });

          // Parse tasks
          const tasks = this.parseAgentTasks(response.content, agent);
          plan.totalTasksGenerated += tasks.length;

          console.log(`✅ ${agentName}: ${tasks.length} tarefas geradas`);
          successCount++;

          // Save to database
          if (tasks.length > 0) {
            await this.saveTasaksToDatabase(tasks, planId, agent);
          }
        } catch (error) {
          console.error(`❌ Erro ao ativar agente:`, error);
          failureCount++;
        }
      }

      plan.status = 'executing';
      plan.result = {
        successCount,
        failureCount,
        summary: `Orquestração concluída: ${successCount} agentes sucesso, ${failureCount} falhas`,
      };

      console.log(`\n✅ Orquestração ${planId} concluída!`);
      console.log(`📊 Total de tarefas geradas: ${plan.totalTasksGenerated}`);

      return plan;
    } catch (error) {
      plan.status = 'failed';
      console.error('Erro fatal na orquestração:', error);
      throw error;
    }
  }

  /**
   * Get status of all agents
   */
  async getAgentsStatus(): Promise<AgentStatus[]> {
    const statuses: AgentStatus[] = [];

    for (const agent of this.agents) {
      const agentName = getAgentName(agent);
      const channelMap: Record<AgentRole, string> = {
        alex: 'Amazon',
        marina: 'MercadoLivre',
        sunny: 'Shopee',
        tren: 'Shein',
        viral: 'TikTok Shop',
        premium: 'Kaway',
        nexo: 'General',
      };

      try {
        // Get task stats from database
        if (!this.supabase) {
          statuses.push({
            agentId: agent,
            agentName,
            channel: channelMap[agent],
            status: 'error',
            tasksGenerated: 0,
            tasksApproved: 0,
            tasksCompleted: 0,
            errorCount: 0,
            lastExecuted: null,
            successRate: 0,
          });
          continue;
        }

        const { data: tasks } = await this.supabase
          .from('tasks')
          .select('status, source_type, admin_approved')
          .eq('channel', agent === 'nexo' ? 'general' : channelMap[agent].toLowerCase());

        const generated = tasks?.filter(t => t.source_type === 'ai_generated').length || 0;
        const approved = tasks?.filter(t => t.admin_approved === true).length || 0;
        const completed = tasks?.filter(t => t.status === 'completed').length || 0;

        const successRate = generated > 0 ? (approved / generated) * 100 : 0;

        statuses.push({
          agentId: agent,
          agentName,
          channel: channelMap[agent],
          status: generated > 0 ? 'active' : 'idle',
          tasksGenerated: generated,
          tasksApproved: approved,
          tasksCompleted: completed,
          errorCount: 0,
          lastExecuted: new Date().toISOString(),
          successRate,
        });
      } catch (error) {
        console.error(`Erro ao obter status de ${agentName}:`, error);
        statuses.push({
          agentId: agent,
          agentName,
          channel: channelMap[agent],
          status: 'error',
          tasksGenerated: 0,
          tasksApproved: 0,
          tasksCompleted: 0,
          errorCount: 1,
          lastExecuted: null,
          successRate: 0,
        });
      }
    }

    return statuses;
  }

  /**
   * Delegate task to specific agent
   */
  async delegateTask(agentId: AgentRole, taskDescription: string): Promise<string> {
    const agentName = getAgentName(agentId);
    console.log(`🎯 NEXO delegando tarefa para ${agentName}: ${taskDescription.substring(0, 50)}...`);

    const agentPrompt = getAgentPrompt(agentId);
    const response = await callAgent({
      systemPrompt: agentPrompt,
      userMessage: taskDescription,
      provider: 'openai',
      maxTokens: 1000,
    });

    return response.content;
  }

  /**
   * Parse tasks from agent response
   */
  private parseAgentTasks(content: string, agent: AgentRole) {
    const tasks: any[] = [];
    const channelMap: Record<AgentRole, string> = {
      alex: 'amazon',
      marina: 'mercadolivre',
      sunny: 'shopee',
      tren: 'shein',
      viral: 'tiktokshop',
      premium: 'kaway',
      nexo: 'general',
    };

    try {
      // Try to extract JSON
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (item.title && item.description) {
              tasks.push({
                title: item.title,
                description: item.description,
                channel: channelMap[agent],
                priority: item.priority || 'medium',
                estimated_hours: item.estimatedHours || 4,
                source_type: 'ai_generated',
                admin_approved: false,
                created_by_agent: agent,
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Erro ao parsear tarefas:', error);
    }

    // If no tasks parsed, create a default one
    if (tasks.length === 0) {
      tasks.push({
        title: `Análise de ${getAgentName(agent)}`,
        description: content.substring(0, 300),
        channel: channelMap[agent],
        priority: 'medium',
        estimated_hours: 2,
        source_type: 'ai_generated',
        admin_approved: false,
        created_by_agent: agent,
      });
    }

    return tasks;
  }

  /**
   * Save tasks to database
   */
  private async saveTasaksToDatabase(tasks: any[], planId: string, agent: AgentRole) {
    if (!this.supabase || tasks.length === 0) return;

    try {
      const dueDateString = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const tasksToInsert = tasks.map(task => ({
        ...task,
        status: 'pending',
        due_date: dueDateString,
        created_at: new Date().toISOString(),
        metadata: {
          planId,
          orchestrator: 'nexo',
        },
      }));

      const { error } = await this.supabase
        .from('tasks')
        .insert(tasksToInsert);

      if (error) {
        console.error('❌ Erro ao salvar tarefas:', error);
      } else {
        console.log(`✅ ${tasks.length} tarefas salvas para ${getAgentName(agent)}`);
      }
    } catch (error) {
      console.error('❌ Erro ao salvar no banco:', error);
    }
  }

  /**
   * Generate orchestration report
   */
  async generateReport(): Promise<string> {
    const statuses = await this.getAgentsStatus();
    const lines = [
      '## 🌐 RELATÓRIO DE ORQUESTRAÇÃO - NEXO',
      `**Data:** ${new Date().toLocaleString('pt-BR')}`,
      '',
      '### 👥 Status dos Agentes:',
      '',
    ];

    for (const status of statuses) {
      const statusIcon = status.status === 'active' ? '✅' : status.status === 'error' ? '❌' : '⏸️';
      lines.push(
        `${statusIcon} **${status.agentName}** (${status.channel})`
      );
      lines.push(`   - Tarefas geradas: ${status.tasksGenerated}`);
      lines.push(`   - Tarefas aprovadas: ${status.tasksApproved}`);
      lines.push(`   - Tarefas completadas: ${status.tasksCompleted}`);
      lines.push(`   - Taxa de sucesso: ${status.successRate.toFixed(1)}%`);
      lines.push('');
    }

    const totalGenerated = statuses.reduce((sum, s) => sum + s.tasksGenerated, 0);
    const totalApproved = statuses.reduce((sum, s) => sum + s.tasksApproved, 0);
    const totalCompleted = statuses.reduce((sum, s) => sum + s.tasksCompleted, 0);

    lines.push('### 📊 Totalizadores:');
    lines.push(`- **Total de tarefas geradas:** ${totalGenerated}`);
    lines.push(`- **Total de tarefas aprovadas:** ${totalApproved}`);
    lines.push(`- **Total de tarefas completadas:** ${totalCompleted}`);
    lines.push(`- **Taxa geral de aprovação:** ${totalGenerated > 0 ? ((totalApproved / totalGenerated) * 100).toFixed(1) : 0}%`);

    return lines.join('\n');
  }
}

// Export singleton instance
export const nexoOrchestrator = new AgentOrchestrator();
