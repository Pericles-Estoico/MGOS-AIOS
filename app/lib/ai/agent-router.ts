import { callAgent, streamAgent, type AgentCallOptions } from './agent-client';
import {
  identifyRelevantAgents,
  getAgentPrompt,
  getAgentName,
  type AgentRole
} from './agent-prompts';

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  agent?: string;
}

export interface RouteResponse {
  message: string;
  agents: string[];
  suggestedTasks?: Array<{
    title: string;
    description: string;
    channel: string;
  }>;
}

/**
 * Route a message to relevant marketplace agents and aggregate responses
 */
export async function routeMessage(
  userMessage: string,
  conversationHistory: ConversationMessage[] = []
): Promise<RouteResponse> {
  // Identify which agents should respond
  const relevantAgents = identifyRelevantAgents(userMessage);

  // If Nexo is the primary respondent, delegate to specialists
  const agentResponses: Record<string, string> = {};

  if (relevantAgents.includes('nexo')) {
    // Get Nexo's routing decision
    const nexoResponse = await callAgent({
      systemPrompt: getNexoOrchestratorPrompt(),
      userMessage,
      provider: 'openai',
      maxTokens: 500,
      conversationHistory: conversationHistory.map(m => ({
        role: m.role,
        content: m.content,
      })),
    });

    agentResponses['nexo'] = nexoResponse.content;

    // Extract which agents Nexo wants to delegate to
    const delegationMatch = nexoResponse.content.match(
      /delega para: (.+?)(?:\n|$)/i
    );
    const delegationText = delegationMatch ? delegationMatch[1] : '';

    // Determine specialized agents to call
    const specializedAgents: AgentRole[] = [];
    if (delegationText.toLowerCase().includes('alex') || delegationText.toLowerCase().includes('amazon')) {
      specializedAgents.push('alex');
    }
    if (delegationText.toLowerCase().includes('marina') || delegationText.toLowerCase().includes('mercadolivre')) {
      specializedAgents.push('marina');
    }
    if (delegationText.toLowerCase().includes('sunny') || delegationText.toLowerCase().includes('shopee')) {
      specializedAgents.push('sunny');
    }
    if (delegationText.toLowerCase().includes('tren') || delegationText.toLowerCase().includes('shein')) {
      specializedAgents.push('tren');
    }
    if (delegationText.toLowerCase().includes('viral') || delegationText.toLowerCase().includes('tiktok')) {
      specializedAgents.push('viral');
    }
    if (delegationText.toLowerCase().includes('premium') || delegationText.toLowerCase().includes('kaway')) {
      specializedAgents.push('premium');
    }

    // Get responses from specialized agents
    for (const agent of specializedAgents) {
      const agentPrompt = getAgentPrompt(agent);
      const agentName = getAgentName(agent);

      try {
        const agentResponse = await callAgent({
          systemPrompt: agentPrompt,
          userMessage,
          provider: 'openai',
          maxTokens: 800,
          conversationHistory: conversationHistory.map(m => ({
            role: m.role,
            content: m.content,
          })),
        });

        agentResponses[agent] = agentResponse.content;
      } catch (error) {
        console.error(`Error calling agent ${agent}:`, error);
        agentResponses[agent] = `Erro ao processar resposta de ${agentName}`;
      }
    }
  } else {
    // Call non-Nexo agents directly
    for (const agent of relevantAgents) {
      const agentPrompt = getAgentPrompt(agent);
      try {
        const response = await callAgent({
          systemPrompt: agentPrompt,
          userMessage,
          provider: 'openai',
          maxTokens: 1000,
          conversationHistory: conversationHistory.map(m => ({
            role: m.role,
            content: m.content,
          })),
        });
        agentResponses[agent] = response.content;
      } catch (error) {
        console.error(`Error calling agent ${agent}:`, error);
      }
    }
  }

  // Aggregate responses
  const aggregatedMessage = aggregateResponses(userMessage, agentResponses);

  // Extract suggested tasks from responses
  const suggestedTasks = extractSuggestedTasks(agentResponses);

  return {
    message: aggregatedMessage,
    agents: Object.keys(agentResponses),
    suggestedTasks,
  };
}

/**
 * Stream responses from agents
 */
export async function* streamRoutedMessage(
  userMessage: string,
  conversationHistory: ConversationMessage[] = []
): AsyncGenerator<string, void, unknown> {
  // Identify relevant agents
  const relevantAgents = identifyRelevantAgents(userMessage);

  // Stream Nexo's response if it's primary
  if (relevantAgents.includes('nexo')) {
    const nexoPrompt = getNexoOrchestratorPrompt();

    yield `[Nexo está analisando sua solicitação...]\n\n`;

    let nexoResponse = '';
    for await (const chunk of streamAgent({
      systemPrompt: nexoPrompt,
      userMessage,
      provider: 'openai',
      maxTokens: 1000,
      conversationHistory: conversationHistory.map(m => ({
        role: m.role,
        content: m.content,
      })),
    })) {
      nexoResponse += chunk;
      yield chunk;
    }

    // Determine which specialists to delegate to
    const specialists = extractSpecialistsDelegation(nexoResponse);

    // Stream specialist responses
    for (const specialist of specialists) {
      const prompt = getAgentPrompt(specialist);
      const name = getAgentName(specialist);

      yield `\n\n---\n\n[${name} está contribuindo...]\n\n`;

      try {
        for await (const chunk of streamAgent({
          systemPrompt: prompt,
          userMessage,
          provider: 'openai',
          maxTokens: 800,
          conversationHistory: conversationHistory.map(m => ({
            role: m.role,
            content: m.content,
          })),
        })) {
          yield chunk;
        }
      } catch (error) {
        console.error(`Erro ao chamar ${specialist}:`, error);
        yield `\nErro ao processar resposta de ${name}`;
      }
    }
  } else {
    // Stream responses from non-Nexo agents directly
    for (const agent of relevantAgents) {
      const prompt = getAgentPrompt(agent);
      const name = getAgentName(agent);

      if (relevantAgents.length > 1) {
        yield `[${name} respondendo...]\n\n`;
      }

      try {
        for await (const chunk of streamAgent({
          systemPrompt: prompt,
          userMessage,
          provider: 'openai',
          maxTokens: 1000,
        })) {
          yield chunk;
        }
      } catch (error) {
        console.error(`Error calling agent ${agent}:`, error);
        yield `\nErro ao processar resposta de ${name}`;
      }

      if (relevantAgents.length > 1) {
        yield '\n\n---\n\n';
      }
    }
  }
}

// --- Export Functions ---

/**
 * Detect if user message intends to create tasks
 */
export function detectTaskCreationIntent(message: string): boolean {
  const creationPhrases = [
    'crie tarefas',
    'criar tarefas',
    'gerar tarefas',
    'adicione tarefa',
    'crie uma tarefa',
    'salva como tarefa',
    'cria no sistema',
    'cria tasks',
    'crie tasks',
    'gere tarefas',
    'cria as tarefas',
    'adicionar tarefas',
    'adicione tarefas',
  ];

  const lowerMessage = message.toLowerCase();
  return creationPhrases.some(phrase => lowerMessage.includes(phrase));
}

// --- Helper Functions ---

function getNexoOrchestratorPrompt(): string {
  return `Você é Nexo, o Marketplace Master. Analize a solicitação do usuário e:

1. Entenda o contexto e a necessidade
2. Decida quais agentes especializados devem contribuir
3. Forneça recomendações estratégicas baseado em seus conhecimentos

Agentes disponíveis:
- Alex (Amazon Specialist)
- Marina (MercadoLivre Specialist)
- Sunny (Shopee Specialist)
- Tren (Shein Specialist)
- Viral (TikTok Shop Specialist)
- Premium (Kaway Specialist)

Se delegar para agentes, mencione no formato: "Delega para: Alex, Marina"

Responda sempre em português (pt-BR).`;
}

function aggregateResponses(
  userMessage: string,
  agentResponses: Record<string, string>
): string {
  const agentList = Object.entries(agentResponses);

  if (agentList.length === 0) {
    return 'Desculpe, não consegui processar sua solicitação.';
  }

  if (agentList.length === 1) {
    return agentList[0][1];
  }

  // Multiple agents - aggregate in a structured way
  let aggregated = '';

  // If Nexo is in the response, start with Nexo
  if (agentResponses['nexo']) {
    aggregated += agentResponses['nexo'] + '\n\n';
  }

  // Add other agent responses
  for (const [agent, response] of agentList) {
    if (agent !== 'nexo') {
      const name = getAgentName(agent as AgentRole);
      aggregated += `**${name}:**\n${response}\n\n`;
    }
  }

  return aggregated;
}

function extractSpecialistsDelegation(nexoResponse: string): AgentRole[] {
  const specialists: AgentRole[] = [];
  const lowerResponse = nexoResponse.toLowerCase();

  if (lowerResponse.includes('alex') || lowerResponse.includes('amazon')) {
    specialists.push('alex');
  }
  if (lowerResponse.includes('marina') || lowerResponse.includes('mercadolivre')) {
    specialists.push('marina');
  }
  if (lowerResponse.includes('sunny') || lowerResponse.includes('shopee')) {
    specialists.push('sunny');
  }
  if (lowerResponse.includes('tren') || lowerResponse.includes('shein')) {
    specialists.push('tren');
  }
  if (lowerResponse.includes('viral') || lowerResponse.includes('tiktok')) {
    specialists.push('viral');
  }
  if (lowerResponse.includes('premium') || lowerResponse.includes('kaway')) {
    specialists.push('premium');
  }

  return specialists;
}

function extractSuggestedTasks(
  agentResponses: Record<string, string>
): Array<{ title: string; description: string; channel: string }> {
  const tasks: Array<{ title: string; description: string; channel: string }> = [];

  // Parse agent responses for task suggestions (simple pattern matching)
  for (const [agent, response] of Object.entries(agentResponses)) {
    // Look for patterns like "Tarefa:" or "Recomendação:"
    const lines = response.split('\n');
    let currentTask: Partial<{ title: string; description: string; channel: string }> = {};

    for (const line of lines) {
      if (line.match(/^(tarefa|recomendação|ação):\s*/i)) {
        if (currentTask.title) {
          tasks.push({
            title: currentTask.title,
            description: currentTask.description || '',
            channel: getChannelName(agent),
          });
        }
        currentTask = { title: line.replace(/^(tarefa|recomendação|ação):\s*/i, '') };
      } else if (line.trim() && currentTask.title && !line.match(/^###?\s/)) {
        currentTask.description = (currentTask.description || '') + ' ' + line.trim();
      }
    }

    if (currentTask.title) {
      tasks.push({
        title: currentTask.title,
        description: (currentTask.description || '').trim(),
        channel: getChannelName(agent),
      });
    }
  }

  return tasks.slice(0, 5); // Limit to 5 suggestions
}

function getChannelName(agent: string): string {
  const channels: Record<string, string> = {
    alex: 'amazon',
    marina: 'mercadolivre',
    sunny: 'shopee',
    tren: 'shein',
    viral: 'tiktok',
    premium: 'kaway',
    nexo: 'general',
  };
  return channels[agent] || 'general';
}
