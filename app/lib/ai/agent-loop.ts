import { callAgent } from './agent-client';
import { getAgentPrompt, getAgentName, type AgentRole } from './agent-prompts';
import { createSupabaseServerClient } from '@lib/supabase';
import {
  getAgentCircuitBreaker,
  canAttemptAgentCall,
  recordAgentSuccess,
  recordAgentFailure,
  type MarketplaceAgent,
} from '@lib/resilience/agent-circuit-breaker';

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
    viral: 'tiktokshop',
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
    viral: 'tiktokshop',
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

// ============================================================================
// ANALYSIS PLAN INTERFACE & FUNCTIONS
// ============================================================================

export interface AnalysisOpportunity {
  id: number;
  priority: 'alta' | 'media' | 'baixa';
  title: string;
  what: string;
  why: string;
  how: string;
  agent: string;
  expectedImpact: string;
  metric: string;
}

export interface AnalysisPhase {
  number: number;
  name: string;
  weeks: string;
  tasks: string[];
  investment: string;
  expectedImpact: string;
}

export interface AnalysisMetric {
  label: string;
  baseline: string;
  goal: string;
  phase: string;
}

export interface AnalysisPlan {
  summary: string;
  channels: string[];
  opportunities: AnalysisOpportunity[];
  phases: AnalysisPhase[];
  metrics: AnalysisMetric[];
}

export interface AnalysisPlanResponse {
  planId: string;
  status: 'pending' | 'approved' | 'rejected';
  channels: string[];
  summary: string;
  createdAt: string;
}

/**
 * Run strategic analysis for specified marketplace channels
 * Calls specialized agent for each channel and aggregates results
 */
export async function runAnalysisPlan(
  channels: string[],
  isScheduled: boolean = false
): Promise<AnalysisPlanResponse> {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const startTime = new Date();
  const aggregatedPlan: AnalysisPlan = {
    summary: '',
    channels,
    opportunities: [],
    phases: [],
    metrics: [],
  };

  // Map channels to agents
  const agentChannelMap: Record<string, AgentRole> = {
    amazon: 'alex',
    mercadolivre: 'marina',
    shopee: 'sunny',
    shein: 'tren',
    tiktok: 'viral',
    'tiktok-shop': 'viral',
    kaway: 'premium',
  };

  // Run analysis for each channel
  const analysisResults: Record<string, string> = {};
  for (const channel of channels) {
    const agent = agentChannelMap[channel];
    if (!agent) {
      console.warn(`No agent mapped for channel: ${channel}`);
      continue;
    }

    try {
      const agentName = getAgentName(agent);
      const analysisPrompt = getAgentPrompt(agent);

      // Check circuit breaker state before attempting agent call
      const channelAsAgent = channel as MarketplaceAgent;
      if (!canAttemptAgentCall(channelAsAgent)) {
        const breaker = getAgentCircuitBreaker(channelAsAgent);
        const metrics = breaker.getMetrics();
        console.warn(
          `⚠️ Circuit breaker OPEN for ${channel}. Recovery time remaining: ${metrics.recoveryTimeRemaining}ms`
        );
        // Use fallback response
        analysisResults[channel] = JSON.stringify({
          summary: `Análise de ${channel} indisponível (serviço em recuperação)`,
          opportunities: [],
          phases: [],
          metrics: [],
        });
        recordAgentFailure(channelAsAgent);
        continue; // Skip to next channel
      }

      const strategicPrompt = `${analysisPrompt}

MODO ANÁLISE ESTRATÉGICA - Você está gerando um plano estratégico profundo.

Contexto:
- Esta é uma ANÁLISE ESTRATÉGICA PROFUNDA, não tarefas operacionais
- Você deve gerar 3-5 oportunidades de alto impacto com ROI claro
- Cada oportunidade deve incluir: O que fazer, Por que, Como, Métrica de sucesso
- Adicione 3 fases de implementação (curto/médio/longo prazo)
- Identifique 4-5 métricas de sucesso com baseline e goal

Formato esperado (JSON estruturado):
{
  "summary": "Resumo executivo de 2-3 frases",
  "opportunities": [
    {
      "id": 1,
      "priority": "alta|media|baixa",
      "title": "Título conciso",
      "what": "O que fazer",
      "why": "Por que é importante",
      "how": "Como executar",
      "agent": "${agentName}",
      "expectedImpact": "% de impacto esperado",
      "metric": "KPI de medição"
    },
    ...
  ],
  "phases": [
    {
      "number": 1,
      "name": "Nome da Fase",
      "weeks": "Semanas 1-4",
      "tasks": ["Tarefa 1", "Tarefa 2"],
      "investment": "Descrição de investimento",
      "expectedImpact": "% de impacto"
    },
    ...
  ],
  "metrics": [
    {
      "label": "Visibilidade",
      "baseline": "Valor atual",
      "goal": "Meta",
      "phase": "Fase X"
    },
    ...
  ]
}`;

      const response = await callAgent({
        systemPrompt: strategicPrompt,
        userMessage: `Gere um plano estratégico completo para otimização de ${channel} em moda bebê e infantil. Inclua oportunidades de alto impacto, fases de implementação e métricas de sucesso.`,
        provider: 'openai',
        maxTokens: 3000,
      });

      // Record success on circuit breaker
      recordAgentSuccess(channelAsAgent);
      analysisResults[channel] = response.content;
    } catch (error) {
      // Record failure on circuit breaker
      const channelAsAgent = channel as MarketplaceAgent;
      recordAgentFailure(channelAsAgent);

      console.error(`Error analyzing channel ${channel}:`, error);
      analysisResults[channel] = `Erro ao analisar ${channel}`;
    }
  }

  // Parse and aggregate results
  for (const [channel, content] of Object.entries(analysisResults)) {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        // Merge opportunities
        if (Array.isArray(parsed.opportunities)) {
          aggregatedPlan.opportunities.push(
            ...parsed.opportunities.map((opp: Record<string, unknown>, idx: number) => ({
              ...opp,
              id: aggregatedPlan.opportunities.length + idx + 1,
            }))
          );
        }

        // Merge phases (aggregate by phase number)
        if (Array.isArray(parsed.phases)) {
          for (const phase of parsed.phases) {
            const existingPhase = aggregatedPlan.phases.find(
              p => p.number === phase.number
            );
            if (existingPhase) {
              existingPhase.tasks = [...new Set([...existingPhase.tasks, ...phase.tasks])];
            } else {
              aggregatedPlan.phases.push(phase);
            }
          }
        }

        // Merge metrics
        if (Array.isArray(parsed.metrics)) {
          aggregatedPlan.metrics.push(...parsed.metrics);
        }

        // Use first summary available
        if (!aggregatedPlan.summary && parsed.summary) {
          aggregatedPlan.summary = parsed.summary;
        }
      }
    } catch (error) {
      console.error(`Error parsing analysis for ${channel}:`, error);
    }
  }

  // Ensure we have a summary
  if (!aggregatedPlan.summary) {
    aggregatedPlan.summary = `Plano estratégico gerado para ${channels.join(', ')} focando em moda bebê e infantil.`;
  }

  // Sort opportunities by priority
  const priorityOrder = { alta: 0, media: 1, baixa: 2 };
  aggregatedPlan.opportunities.sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  // Sort phases by number
  aggregatedPlan.phases.sort((a, b) => a.number - b.number);

  try {
    // Save plan to database with initial 'pending' status
    const { data, error } = await supabase
      .from('marketplace_plans')
      .insert({
        title: `Análise ${channels.join(' + ')} - ${new Date().toLocaleDateString('pt-BR')}`,
        description: aggregatedPlan.summary,
        channels,
        plan_data: aggregatedPlan,
        status: 'pending',
        created_by_agent: isScheduled ? 'scheduler' : 'nexo',
        is_scheduled: isScheduled,
        created_at: startTime.toISOString(),
        updated_at: startTime.toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error saving analysis plan:', error);
      throw error;
    }

    const planId = data.id;

    // AUTO-APPROVE: Immediately create Phase 1 tasks and mark as approved
    let phase1TaskIds: string[] = [];
    let finalStatus: 'pending' | 'approved' | 'rejected' = 'pending'; // Default fallback

    try {
      console.log(`📊 Auto-approving analysis ${planId}...`);

      // Create Phase 1 tasks
      phase1TaskIds = await createPhase1Tasks(planId);

      // Update plan to 'approved' status
      const { error: approveError } = await supabase
        .from('marketplace_plans')
        .update({
          status: 'approved',
          approved_by: 'system-auto',
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', planId);

      if (approveError) {
        console.warn(`⚠️ Error updating plan to approved:`, approveError);
      } else {
        finalStatus = 'approved';
        console.log(`✅ Analysis auto-approved: ${phase1TaskIds.length} Phase 1 tasks created`);
      }
    } catch (autoApproveError) {
      console.warn(`⚠️ Auto-approve failed (non-fatal):`, autoApproveError);
      // Don't fail the analysis creation if auto-approve fails
      // User can approve manually later
    }

    return {
      planId,
      status: finalStatus,
      channels,
      summary: aggregatedPlan.summary,
      createdAt: startTime.toISOString(),
      phase1TasksCreated: phase1TaskIds.length,
      taskIds: phase1TaskIds,
    };
  } catch (error) {
    console.error('Error creating analysis plan:', error);
    throw error;
  }
}

/**
 * Run strategic analysis with external file context
 * Used for uploaded analysis documents (PDFs, TXT, CSV, JSON)
 */
export async function runAnalysisPlanWithContext(
  channels: string[],
  fileContext: string,
  fileName: string,
  isScheduled: boolean = false
): Promise<AnalysisPlanResponse> {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const startTime = new Date();
  const aggregatedPlan: AnalysisPlan = {
    summary: '',
    channels,
    opportunities: [],
    phases: [],
    metrics: [],
  };

  // Map channels to agents
  const agentChannelMap: Record<string, AgentRole> = {
    amazon: 'alex',
    mercadolivre: 'marina',
    shopee: 'sunny',
    shein: 'tren',
    tiktok: 'viral',
    'tiktok-shop': 'viral',
    kaway: 'premium',
  };

  // Extract file context preview (first 8000 chars)
  const contextPreview = fileContext.slice(0, 8000);
  const hasMoreContent = fileContext.length > 8000;

  // Run analysis for each channel
  const analysisResults: Record<string, string> = {};
  for (const channel of channels) {
    const agent = agentChannelMap[channel];
    if (!agent) {
      console.warn(`No agent mapped for channel: ${channel}`);
      continue;
    }

    try {
      const agentName = getAgentName(agent);
      const analysisPrompt = getAgentPrompt(agent);

      const strategicPrompt = `${analysisPrompt}

MODO ANÁLISE ESTRATÉGICA COM CONTEXTO DE ARQUIVO - Você está gerando um plano estratégico profundo baseado em dados fornecidos.

[CONTEXTO DO ARQUIVO: ${fileName}]
${contextPreview}${hasMoreContent ? '\n... (documento continua)' : ''}

Análise com Base no Documento:
- Revise os dados e oportunidades mencionados
- Identifique padrões e tendências relevantes para ${channel}
- Gere um plano estratégico específico para os dados fornecidos

Contexto:
- Esta é uma ANÁLISE ESTRATÉGICA PROFUNDA baseada em dados reais
- Você deve gerar 3-5 oportunidades de alto impacto com ROI claro
- Cada oportunidade deve incluir: O que fazer, Por que, Como, Métrica de sucesso
- Adicione 3 fases de implementação (curto/médio/longo prazo)
- Identifique 4-5 métricas de sucesso com baseline e goal

Formato esperado (JSON estruturado):
{
  "summary": "Resumo executivo de 2-3 frases baseado no documento",
  "opportunities": [
    {
      "id": 1,
      "priority": "alta|media|baixa",
      "title": "Título conciso",
      "what": "O que fazer",
      "why": "Por que é importante",
      "how": "Como executar",
      "agent": "${agentName}",
      "expectedImpact": "% de impacto esperado",
      "metric": "KPI de medição"
    },
    ...
  ],
  "phases": [
    {
      "number": 1,
      "name": "Nome da Fase",
      "weeks": "Semanas 1-4",
      "tasks": ["Tarefa 1", "Tarefa 2"],
      "investment": "Descrição de investimento",
      "expectedImpact": "% de impacto"
    },
    ...
  ],
  "metrics": [
    {
      "label": "Visibilidade",
      "baseline": "Valor atual",
      "goal": "Meta",
      "phase": "Fase X"
    },
    ...
  ]
}`;

      const response = await callAgent({
        systemPrompt: strategicPrompt,
        userMessage: `Gere um plano estratégico completo para otimização de ${channel} em moda bebê e infantil, baseado nos dados do arquivo: ${fileName}. Inclua oportunidades de alto impacto, fases de implementação e métricas de sucesso.`,
        provider: 'openai',
        maxTokens: 3000,
      });

      analysisResults[channel] = response.content;
    } catch (error) {
      console.error(`Error analyzing channel ${channel}:`, error);
      analysisResults[channel] = `Erro ao analisar ${channel}`;
    }
  }

  // Parse and aggregate results
  for (const [channel, content] of Object.entries(analysisResults)) {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        // Merge opportunities
        if (Array.isArray(parsed.opportunities)) {
          aggregatedPlan.opportunities.push(
            ...parsed.opportunities.map((opp: Record<string, unknown>, idx: number) => ({
              ...opp,
              id: aggregatedPlan.opportunities.length + idx + 1,
            }))
          );
        }

        // Merge phases
        if (Array.isArray(parsed.phases)) {
          for (const phase of parsed.phases) {
            const existingPhase = aggregatedPlan.phases.find(
              p => p.number === phase.number
            );
            if (existingPhase) {
              existingPhase.tasks = [...new Set([...existingPhase.tasks, ...phase.tasks])];
            } else {
              aggregatedPlan.phases.push(phase);
            }
          }
        }

        // Merge metrics
        if (Array.isArray(parsed.metrics)) {
          aggregatedPlan.metrics.push(...parsed.metrics);
        }

        // Use first summary available
        if (!aggregatedPlan.summary && parsed.summary) {
          aggregatedPlan.summary = parsed.summary;
        }
      }
    } catch (error) {
      console.error(`Error parsing analysis for ${channel}:`, error);
    }
  }

  // Ensure we have a summary
  if (!aggregatedPlan.summary) {
    aggregatedPlan.summary = `Plano estratégico gerado para ${channels.join(', ')} focando em moda bebê e infantil, baseado no arquivo: ${fileName}.`;
  }

  // Sort opportunities by priority
  const priorityOrder = { alta: 0, media: 1, baixa: 2 };
  aggregatedPlan.opportunities.sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  // Sort phases by number
  aggregatedPlan.phases.sort((a, b) => a.number - b.number);

  try {
    // Save plan to database
    const { data, error } = await supabase
      .from('marketplace_plans')
      .insert({
        title: `Análise ${channels.join(' + ')} - ${fileName} - ${new Date().toLocaleDateString('pt-BR')}`,
        description: aggregatedPlan.summary,
        channels,
        plan_data: aggregatedPlan,
        status: 'pending',
        created_by_agent: 'nexo-upload',
        is_scheduled: isScheduled,
        file_source: fileName,
        created_at: startTime.toISOString(),
        updated_at: startTime.toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error saving analysis plan:', error);
      throw error;
    }

    return {
      planId: data.id,
      status: 'pending',
      channels,
      summary: aggregatedPlan.summary,
      createdAt: startTime.toISOString(),
    };
  } catch (error) {
    console.error('Error creating analysis plan:', error);
    throw error;
  }
}

/**
 * Create Phase 1 tasks from approved analysis plan
 * Includes fallback: if Phase 1 not found, auto-generate from opportunities
 */
export async function createPhase1Tasks(planId: string): Promise<string[]> {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  try {
    // Fetch the plan
    const { data: plan, error: fetchError } = await supabase
      .from('marketplace_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (fetchError || !plan) {
      throw new Error(`Plan not found: ${planId}`);
    }

    const planData = plan.plan_data as AnalysisPlan;

    // Log plan data for debugging
    console.log(`📊 Plan Data for ${planId}:`, {
      phases: planData.phases?.length || 0,
      opportunities: planData.opportunities?.length || 0,
      channels: planData.channels,
    });

    // Try to find Phase 1
    let phase1 = planData.phases?.find(p => p.number === 1);

    // FALLBACK: If Phase 1 not found, auto-generate from opportunities
    if (!phase1) {
      console.warn(
        `⚠️ Phase 1 not found in plan. Phases: ${JSON.stringify(planData.phases || [])}. Auto-generating from opportunities...`
      );

      // Auto-generate Phase 1 from high-priority opportunities
      const highPriorityOpps = (planData.opportunities || [])
        .filter(opp => opp.priority === 'alta')
        .slice(0, 5); // Take top 5

      if (highPriorityOpps.length === 0) {
        throw new Error(
          'Cannot create Phase 1: No Phase 1 found and no high-priority opportunities to generate tasks'
        );
      }

      // Create Phase 1 from opportunities
      phase1 = {
        number: 1,
        name: 'Fase 1 - Otimizações Rápidas',
        weeks: 'Semanas 1-4',
        tasks: highPriorityOpps.map(opp => `${opp.title}: ${opp.what}`),
        investment: 'Equipe interna, ferramentas básicas',
        expectedImpact: '15-20% de melhoria em KPIs principais',
      };

      console.log(`✅ Auto-generated Phase 1 with ${phase1.tasks.length} tasks`);
    }

    // Validate Phase 1 has tasks
    if (!phase1.tasks || phase1.tasks.length === 0) {
      throw new Error('Phase 1 has no tasks to create');
    }

    const dueDateString = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    )
      .toISOString()
      .split('T')[0];

    // Create tasks for Phase 1
    const tasksToInsert = phase1.tasks.map((taskTitle, idx) => ({
      title: taskTitle,
      description: `Tarefa da Fase 1 do plano de análise ${plan.title}`,
      channel: plan.channels[0], // Primary channel
      priority: idx === 0 ? 'high' : 'medium',
      status: 'pending',
      source_type: 'analysis_approved',
      admin_approved: false,
      estimated_hours: 8,
      due_date: dueDateString,
      created_at: new Date().toISOString(),
    }));

    console.log(`📝 Creating ${tasksToInsert.length} Phase 1 tasks...`);

    const { data: insertedTasks, error: insertError } = await supabase
      .from('tasks')
      .insert(tasksToInsert)
      .select('id');

    if (insertError) {
      console.error('❌ Error creating Phase 1 tasks:', insertError);
      throw insertError;
    }

    const taskIds = insertedTasks?.map(t => t.id) || [];
    console.log(`✅ Created ${taskIds.length} Phase 1 tasks: ${taskIds.join(', ')}`);

    // Update plan with task tracking
    await supabase
      .from('marketplace_plans')
      .update({
        phase1_tasks_created: true,
        phase1_created_at: new Date().toISOString(),
        phase1_task_ids: taskIds,
      })
      .eq('id', planId);

    return taskIds;
  } catch (error) {
    console.error('❌ Error creating Phase 1 tasks:', error);
    throw error;
  }
}
