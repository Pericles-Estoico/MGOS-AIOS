import { callAgent } from './agent-client';
import { getAgentPrompt, getAgentName, type AgentRole } from './agent-prompts';
import { createSupabaseServerClient } from '@/lib/supabase';

export interface LoopExecutionResult {
  timestamp: string;
  agents: Record<string, {
    success: boolean;
    tasksGenerated: number;
    summary: string;
    error?: string;
  }>;
  totalTasks: number;
  nextExecutionTime: string;
}

export interface GeneratedTask {
  title: string;
  description: string;
  channel: string;
  priority: 'low' | 'medium' | 'high';
  estimatedHours: number;
  agentRecommendation: string;
}

/**
 * Run autonomous loop for all marketplace agents
 * Agents analyze metrics and generate optimization tasks
 */
export async function runAutonomousLoop(): Promise<LoopExecutionResult> {
  const startTime = new Date();
  const result: LoopExecutionResult = {
    timestamp: startTime.toISOString(),
    agents: {},
    totalTasks: 0,
    nextExecutionTime: new Date(startTime.getTime() + 6 * 60 * 60 * 1000).toISOString(),
  };

  // Agents to run in the autonomous loop
  const agents: AgentRole[] = ['alex', 'marina', 'sunny', 'tren', 'viral', 'premium'];

  // Run each agent's autonomous analysis
  for (const agent of agents) {
    try {
      const agentName = getAgentName(agent);
      const tasks = await runAgentAnalysis(agent);

      result.agents[agent] = {
        success: true,
        tasksGenerated: tasks.length,
        summary: `${agentName} gerou ${tasks.length} tarefas de otimização`,
      };

      result.totalTasks += tasks.length;

      // Save tasks to Supabase
      if (tasks.length > 0) {
        await saveTaksToSupabase(tasks);
      }
    } catch (error) {
      const agentName = getAgentName(agent);
      console.error(`Error in agent loop for ${agent}:`, error);

      result.agents[agent] = {
        success: false,
        tasksGenerated: 0,
        summary: `Erro ao processar ${agentName}`,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  return result;
}

/**
 * Run analysis for a single agent in autonomous mode
 */
async function runAgentAnalysis(agent: AgentRole): Promise<GeneratedTask[]> {
  const agentPrompt = getAgentPrompt(agent);
  const agentName = getAgentName(agent);

  const autonomousPrompt = `${agentPrompt}

MODO AUTÔNOMO - Você está analisando dados e gerando tarefas de otimização.

Contexto:
- Esta é uma análise AUTÔNOMA, não uma resposta a uma solicitação de usuário
- Você deve gerar 3-5 tarefas práticas de otimização baseado em best practices
- Cada tarefa deve ser acionável em 1-3 dias de trabalho
- Priorize high-impact, quick-win tasks

Formato esperado de resposta (JSON):
[
  {
    "title": "Título da tarefa",
    "description": "Descrição detalhada do que fazer",
    "priority": "high|medium|low",
    "estimatedHours": 4,
    "recommendation": "Por que esta tarefa é importante para ${agentName}"
  },
  ...
]

Gere apenas tasks relevantes para seu canal de especialidade. Foque em:
1. Análise de performance
2. Otimizações de conversão
3. Estratégias de conteúdo
4. Parcerias/integrações
5. Inovações para capturar oportunidades`;

  const response = await callAgent({
    systemPrompt: autonomousPrompt,
    userMessage: `Gere tarefas de otimização para ${agentName} baseado em best practices do mercado e tendências atuais.`,
    provider: 'openai',
    maxTokens: 2000,
  });

  // Parse JSON response
  const tasks = parseTasksFromResponse(response.content, agent);
  return tasks;
}

/**
 * Parse tasks from agent response
 */
function parseTasksFromResponse(content: string, agent: AgentRole): GeneratedTask[] {
  const tasks: GeneratedTask[] = [];
  const channelMap: Record<AgentRole, string> = {
    alex: 'amazon',
    marina: 'mercadolivre',
    sunny: 'shopee',
    tren: 'shein',
    viral: 'tiktok',
    premium: 'kaway',
    nexo: 'general',
  };

  try {
    // Try to extract JSON from the response
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
              priority: (item.priority || 'medium') as 'low' | 'medium' | 'high',
              estimatedHours: item.estimatedHours || 4,
              agentRecommendation: item.recommendation || 'Tarefa recomendada pelo agente',
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Error parsing tasks from response:', error);
    // Fallback: extract tasks from text format
    return extractTasksFromText(content, agent);
  }

  // If no tasks parsed, create default task from content
  if (tasks.length === 0) {
    tasks.push({
      title: `Análise de ${getAgentName(agent)}`,
      description: content.substring(0, 300),
      channel: channelMap[agent],
      priority: 'medium',
      estimatedHours: 2,
      agentRecommendation: 'Análise gerada automaticamente',
    });
  }

  return tasks;
}

/**
 * Extract tasks from text format response
 */
function extractTasksFromText(content: string, agent: AgentRole): GeneratedTask[] {
  const tasks: GeneratedTask[] = [];
  const channelMap: Record<AgentRole, string> = {
    alex: 'amazon',
    marina: 'mercadolivre',
    sunny: 'shopee',
    tren: 'shein',
    viral: 'tiktok',
    premium: 'kaway',
    nexo: 'general',
  };

  // Split by numbered items or bullet points
  const lines = content.split(/\n(?=\d+\.|[-•])/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length > 20) {
      // Extract priority if mentioned
      let priority: 'low' | 'medium' | 'high' = 'medium';
      if (trimmed.toLowerCase().includes('high') || trimmed.toLowerCase().includes('urgente')) {
        priority = 'high';
      } else if (trimmed.toLowerCase().includes('low') || trimmed.toLowerCase().includes('baixa')) {
        priority = 'low';
      }

      tasks.push({
        title: trimmed.substring(0, 100),
        description: trimmed,
        channel: channelMap[agent],
        priority,
        estimatedHours: 4,
        agentRecommendation: `Recomendado por ${getAgentName(agent)}`,
      });
    }
  }

  return tasks.slice(0, 5); // Max 5 tasks per agent
}

/**
 * Save generated tasks to Supabase
 */
async function saveTaksToSupabase(tasks: GeneratedTask[]): Promise<void> {
  const supabase = createSupabaseServerClient();
  if (!supabase || tasks.length === 0) {
    return;
  }

  try {
    const dueDateString = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const tasksToInsert = tasks.map(task => ({
      title: task.title,
      description: task.description,
      channel: task.channel,
      priority: task.priority,
      status: 'pending',
      source_type: 'ai_generated',
      admin_approved: false,
      estimated_hours: task.estimatedHours,
      due_date: dueDateString,
      created_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('tasks')
      .insert(tasksToInsert);

    if (error) {
      console.error('❌ Erro ao salvar tarefas no Supabase:', error);
    } else {
      console.log(`✅ ${tasks.length} tarefas salvas no Supabase`);
    }
  } catch (error) {
    console.error('❌ Erro ao salvar tarefas:', error);
  }
}

/**
 * Generate a summary report from loop execution
 */
export function generateLoopSummary(result: LoopExecutionResult): string {
  const lines: string[] = [
    '## Relatório de Execução - Loop Autônomo',
    `**Timestamp:** ${new Date(result.timestamp).toLocaleString('pt-BR')}`,
    `**Total de Tarefas Geradas:** ${result.totalTasks}`,
    '',
    '### Por Agente:',
  ];

  for (const [agent, status] of Object.entries(result.agents)) {
    const agentName = getAgentName(agent as AgentRole);
    const icon = status.success ? '✅' : '❌';

    lines.push(
      `${icon} **${agentName}:** ${status.tasksGenerated} tarefas geradas`
    );

    if (status.error) {
      lines.push(`   ⚠️ ${status.error}`);
    }
  }

  lines.push('');
  lines.push(`**Próxima Execução:** ${new Date(result.nextExecutionTime).toLocaleString('pt-BR')}`);

  return lines.join('\n');
}

/**
 * Schedule autonomous loop to run periodically
 * (This would typically be called from a cron job or scheduler)
 */
export async function scheduleAutonomousLoop(intervalHours: number = 6): Promise<void> {
  const interval = intervalHours * 60 * 60 * 1000;

  console.log(
    `Scheduling autonomous loop to run every ${intervalHours} hours`
  );

  setInterval(async () => {
    try {
      console.log('Running scheduled autonomous loop...');
      const result = await runAutonomousLoop();
      console.log('Loop completed:', result);

      // TODO: Log to database
      // await logLoopExecution(result);
    } catch (error) {
      console.error('Error in scheduled autonomous loop:', error);
    }
  }, interval);
}
