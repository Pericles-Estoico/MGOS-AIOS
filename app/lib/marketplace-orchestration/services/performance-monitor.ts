/**
 * Performance Monitor - Rastreia desempenho de cada agente
 * Monitora métricas, identifica gargalos, sugere otimizações
 */

import { createSupabaseServerClient } from '@lib/supabase';
import { getAgentName, type AgentRole } from '@lib/ai/agent-prompts';

export interface AgentMetrics {
  agentId: AgentRole;
  agentName: string;
  tasksGenerated: number;
  tasksApproved: number;
  tasksRejected: number;
  tasksCompleted: number;
  approvalRate: number;
  completionRate: number;
  averageExecutionTime: number;
  recentErrors: number;
  lastActivity: string | null;
  performanceScore: number;
}

export interface ChannelPerformance {
  channel: string;
  totalTasks: number;
  completionRate: number;
  avgCompletionTime: number;
  activeAgents: number;
  topAgent: string;
  recommendations: string[];
}

export interface SystemMetrics {
  timestamp: string;
  totalAgents: number;
  activeAgents: number;
  totalTasksGenerated: number;
  totalTasksCompleted: number;
  systemHealth: 'excellent' | 'good' | 'fair' | 'poor';
  bottlenecks: string[];
  recommendations: string[];
}

export class PerformanceMonitor {
  private supabase = createSupabaseServerClient();
  private agents: AgentRole[] = ['alex', 'marina', 'sunny', 'tren', 'viral', 'premium'];

  /**
   * Get comprehensive metrics for single agent
   */
  async getAgentMetrics(agentId: AgentRole): Promise<AgentMetrics> {
    const agentName = getAgentName(agentId);
    const channelMap: Record<AgentRole, string> = {
      alex: 'amazon',
      marina: 'mercadolivre',
      sunny: 'shopee',
      tren: 'shein',
      viral: 'tiktokshop',
      premium: 'kaway',
      nexo: 'general',
    };

    const channel = channelMap[agentId];

    if (!this.supabase) {
      return {
        agentId,
        agentName,
        tasksGenerated: 0,
        tasksApproved: 0,
        tasksRejected: 0,
        tasksCompleted: 0,
        approvalRate: 0,
        completionRate: 0,
        averageExecutionTime: 0,
        recentErrors: 0,
        lastActivity: null,
        performanceScore: 0,
      };
    }

    try {
      const { data: tasks } = await this.supabase
        .from('tasks')
        .select('status, admin_approved, created_at, completed_at, channel')
        .eq('created_by_agent', agentId);

      if (!tasks) {
        return {
          agentId,
          agentName,
          tasksGenerated: 0,
          tasksApproved: 0,
          tasksRejected: 0,
          tasksCompleted: 0,
          approvalRate: 0,
          completionRate: 0,
          averageExecutionTime: 0,
          recentErrors: 0,
          lastActivity: null,
          performanceScore: 0,
        };
      }

      const generated = tasks.length;
      const approved = tasks.filter(t => t.admin_approved === true).length;
      const rejected = tasks.filter(t => t.admin_approved === false && t.status === 'rejected').length;
      const completed = tasks.filter(t => t.status === 'completed').length;

      const approvalRate = generated > 0 ? (approved / generated) * 100 : 0;
      const completionRate = generated > 0 ? (completed / generated) * 100 : 0;

      // Calculate average execution time
      const completedTasks = tasks.filter(t => t.completed_at && t.created_at);
      const avgExecutionTime =
        completedTasks.length > 0
          ? completedTasks.reduce((sum, t) => {
              const createdAt = new Date(t.created_at).getTime();
              const completedAt = new Date(t.completed_at!).getTime();
              return sum + (completedAt - createdAt);
            }, 0) / completedTasks.length / (1000 * 60) // Convert to minutes
          : 0;

      // Performance score (0-100)
      const performanceScore = (approvalRate * 0.5 + completionRate * 0.3 + Math.min(100, (avgExecutionTime / 480) * 100) * 0.2);

      return {
        agentId,
        agentName,
        tasksGenerated: generated,
        tasksApproved: approved,
        tasksRejected: rejected,
        tasksCompleted: completed,
        approvalRate,
        completionRate,
        averageExecutionTime: Math.round(avgExecutionTime),
        recentErrors: 0,
        lastActivity: tasks.length > 0 ? tasks[tasks.length - 1].created_at : null,
        performanceScore: Math.round(performanceScore),
      };
    } catch (error) {
      console.error(`Erro ao obter métricas de ${agentName}:`, error);
      return {
        agentId,
        agentName,
        tasksGenerated: 0,
        tasksApproved: 0,
        tasksRejected: 0,
        tasksCompleted: 0,
        approvalRate: 0,
        completionRate: 0,
        averageExecutionTime: 0,
        recentErrors: 1,
        lastActivity: null,
        performanceScore: 0,
      };
    }
  }

  /**
   * Get performance metrics for all agents
   */
  async getAllAgentMetrics(): Promise<AgentMetrics[]> {
    const metrics: AgentMetrics[] = [];

    for (const agent of this.agents) {
      const agentMetrics = await this.getAgentMetrics(agent);
      metrics.push(agentMetrics);
    }

    return metrics;
  }

  /**
   * Get channel-wide performance
   */
  async getChannelPerformance(channel: string): Promise<ChannelPerformance> {
    if (!this.supabase) {
      return {
        channel,
        totalTasks: 0,
        completionRate: 0,
        avgCompletionTime: 0,
        activeAgents: 0,
        topAgent: 'N/A',
        recommendations: [],
      };
    }

    try {
      const { data: tasks } = await this.supabase
        .from('tasks')
        .select('status, created_by_agent, created_at, completed_at')
        .eq('channel', channel);

      if (!tasks || tasks.length === 0) {
        return {
          channel,
          totalTasks: 0,
          completionRate: 0,
          avgCompletionTime: 0,
          activeAgents: 0,
          topAgent: 'N/A',
          recommendations: ['Nenhuma atividade ainda. Ative os agentes para gerar tarefas.'],
        };
      }

      const completed = tasks.filter(t => t.status === 'completed').length;
      const completionRate = (completed / tasks.length) * 100;

      // Calculate average completion time
      const completedTasks = tasks.filter(t => t.completed_at && t.created_at);
      const avgCompletionTime =
        completedTasks.length > 0
          ? completedTasks.reduce((sum, t) => {
              const createdAt = new Date(t.created_at).getTime();
              const completedAt = new Date(t.completed_at!).getTime();
              return sum + (completedAt - createdAt);
            }, 0) / completedTasks.length / (1000 * 60 * 60) // Convert to hours
          : 0;

      // Find top agent
      const agentTaskCounts = new Map<string, number>();
      for (const task of tasks) {
        const count = agentTaskCounts.get(task.created_by_agent) || 0;
        agentTaskCounts.set(task.created_by_agent, count + 1);
      }

      const topAgent = Array.from(agentTaskCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

      // Generate recommendations
      const recommendations: string[] = [];
      if (completionRate < 50) {
        recommendations.push('⚠️ Baixa taxa de conclusão. Verifique gargalos no workflow.');
      }
      if (avgCompletionTime > 24) {
        recommendations.push('⏱️ Tempo de conclusão alto. Considere paralelizar tarefas.');
      }
      if (tasks.length < 5) {
        recommendations.push('📈 Aumente volume de tarefas. Ative mais agentes.');
      }

      return {
        channel,
        totalTasks: tasks.length,
        completionRate,
        avgCompletionTime,
        activeAgents: agentTaskCounts.size,
        topAgent,
        recommendations,
      };
    } catch (error) {
      console.error(`Erro ao obter desempenho do canal ${channel}:`, error);
      return {
        channel,
        totalTasks: 0,
        completionRate: 0,
        avgCompletionTime: 0,
        activeAgents: 0,
        topAgent: 'N/A',
        recommendations: ['Erro ao obter dados. Verifique conexão.'],
      };
    }
  }

  /**
   * Get system-wide metrics
   */
  async getSystemMetrics(): Promise<SystemMetrics> {
    const allMetrics = await this.getAllAgentMetrics();
    const activeAgents = allMetrics.filter(m => m.tasksGenerated > 0).length;

    const totalGenerated = allMetrics.reduce((sum, m) => sum + m.tasksGenerated, 0);
    const totalCompleted = allMetrics.reduce((sum, m) => sum + m.tasksCompleted, 0);

    const avgApprovalRate = allMetrics.length > 0
      ? allMetrics.reduce((sum, m) => sum + m.approvalRate, 0) / allMetrics.length
      : 0;

    const avgCompletionRate = allMetrics.length > 0
      ? allMetrics.reduce((sum, m) => sum + m.completionRate, 0) / allMetrics.length
      : 0;

    // Determine system health
    let systemHealth: 'excellent' | 'good' | 'fair' | 'poor' = 'excellent';
    if (avgApprovalRate < 60 || avgCompletionRate < 50) {
      systemHealth = 'poor';
    } else if (avgApprovalRate < 70 || avgCompletionRate < 70) {
      systemHealth = 'fair';
    } else if (avgApprovalRate < 85 || avgCompletionRate < 85) {
      systemHealth = 'good';
    }

    // Identify bottlenecks
    const bottlenecks: string[] = [];
    const lowPerformers = allMetrics.filter(m => m.performanceScore < 50);
    if (lowPerformers.length > 0) {
      bottlenecks.push(`⚠️ ${lowPerformers.map(m => m.agentName).join(', ')} com baixo desempenho`);
    }

    const recommendations: string[] = [];
    if (activeAgents < 4) {
      recommendations.push('📈 Ative mais agentes para aumentar capacidade');
    }
    if (avgApprovalRate < 70) {
      recommendations.push('🔍 Revise critérios de aprovação. Taxa muito baixa.');
    }
    if (avgCompletionRate < 60) {
      recommendations.push('⚡ Otimize workflow de execução de tarefas');
    }

    return {
      timestamp: new Date().toISOString(),
      totalAgents: this.agents.length,
      activeAgents,
      totalTasksGenerated: totalGenerated,
      totalTasksCompleted: totalCompleted,
      systemHealth,
      bottlenecks,
      recommendations,
    };
  }

  /**
   * Generate performance report
   */
  async generatePerformanceReport(): Promise<string> {
    const systemMetrics = await this.getSystemMetrics();
    const allMetrics = await this.getAllAgentMetrics();

    const lines = [
      '## 📊 RELATÓRIO DE DESEMPENHO - SISTEMA COMPLETO',
      `**Data:** ${new Date(systemMetrics.timestamp).toLocaleString('pt-BR')}`,
      `**Saúde do Sistema:** ${systemMetrics.systemHealth === 'excellent' ? '✅ Excelente' : systemMetrics.systemHealth === 'good' ? '✅ Bom' : systemMetrics.systemHealth === 'fair' ? '⚠️ Aceitável' : '❌ Crítico'}`,
      '',
      '### 👥 Desempenho por Agente:',
      '',
    ];

    for (const metrics of allMetrics) {
      const healthIcon = metrics.performanceScore >= 80 ? '✅' : metrics.performanceScore >= 60 ? '⚠️' : '❌';
      lines.push(`${healthIcon} **${metrics.agentName}**`);
      lines.push(`   - Score: ${metrics.performanceScore}/100`);
      lines.push(`   - Tarefas: ${metrics.tasksGenerated} geradas, ${metrics.tasksApproved} aprovadas, ${metrics.tasksCompleted} concluídas`);
      lines.push(`   - Taxa aprovação: ${metrics.approvalRate.toFixed(1)}%`);
      lines.push(`   - Taxa conclusão: ${metrics.completionRate.toFixed(1)}%`);
      if (metrics.averageExecutionTime > 0) {
        lines.push(`   - Tempo médio: ${metrics.averageExecutionTime} minutos`);
      }
      lines.push('');
    }

    lines.push('### 📈 Totalizadores do Sistema:');
    lines.push(`- **Agentes Ativos:** ${systemMetrics.activeAgents}/${systemMetrics.totalAgents}`);
    lines.push(`- **Tarefas Geradas:** ${systemMetrics.totalTasksGenerated}`);
    lines.push(`- **Tarefas Concluídas:** ${systemMetrics.totalTasksCompleted}`);
    lines.push(`- **Taxa Conclusão:** ${systemMetrics.totalTasksGenerated > 0 ? ((systemMetrics.totalTasksCompleted / systemMetrics.totalTasksGenerated) * 100).toFixed(1) : 0}%`);

    if (systemMetrics.bottlenecks.length > 0) {
      lines.push('');
      lines.push('### ⚠️ Gargalos Identificados:');
      for (const bottleneck of systemMetrics.bottlenecks) {
        lines.push(`- ${bottleneck}`);
      }
    }

    if (systemMetrics.recommendations.length > 0) {
      lines.push('');
      lines.push('### 💡 Recomendações:');
      for (const rec of systemMetrics.recommendations) {
        lines.push(`- ${rec}`);
      }
    }

    return lines.join('\n');
  }
}

// Export singleton
export const performanceMonitor = new PerformanceMonitor();
