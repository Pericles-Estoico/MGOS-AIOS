import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

// Initialize clients
export const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const anthropicClient = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export type AIProvider = 'openai' | 'anthropic';

export interface AgentCallOptions {
  systemPrompt: string;
  userMessage: string;
  provider?: AIProvider;
  temperature?: number;
  maxTokens?: number;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface AgentCallResponse {
  content: string;
  provider: AIProvider;
  tokenUsage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}

/**
 * Call an agent with message, trying OpenAI first, falling back to Anthropic
 */
export async function callAgent(options: AgentCallOptions): Promise<AgentCallResponse> {
  const {
    systemPrompt,
    userMessage,
    provider = 'openai',
    temperature = 0.7,
    maxTokens = 2000,
    conversationHistory = [],
  } = options;

  const messages = [
    ...conversationHistory.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
    { role: 'user' as const, content: userMessage },
  ];

  try {
    if (provider === 'openai') {
      return await callOpenAI({
        systemPrompt,
        messages,
        temperature,
        maxTokens,
      });
    } else {
      return await callAnthropic({
        systemPrompt,
        messages,
        temperature,
        maxTokens,
      });
    }
  } catch (error) {
    // Fallback to Anthropic if OpenAI fails
    if (provider === 'openai') {
      console.warn('OpenAI call failed, falling back to Anthropic:', error);
      return await callAnthropic({
        systemPrompt,
        messages,
        temperature,
        maxTokens,
      });
    }
    throw error;
  }
}

/**
 * Stream agent response with Server-Sent Events
 */
export async function* streamAgent(options: AgentCallOptions): AsyncGenerator<string, void, unknown> {
  const {
    systemPrompt,
    userMessage,
    provider = 'openai',
    temperature = 0.7,
    maxTokens = 2000,
  } = options;

  const messages = [{ role: 'user' as const, content: userMessage }];

  try {
    if (provider === 'openai') {
      yield* streamOpenAI({
        systemPrompt,
        messages,
        temperature,
        maxTokens,
      });
    } else {
      yield* streamAnthropic({
        systemPrompt,
        messages,
        temperature,
        maxTokens,
      });
    }
  } catch (error) {
    // Fallback to Anthropic if OpenAI fails
    if (provider === 'openai') {
      console.warn('OpenAI stream failed, falling back to Anthropic:', error);
      yield* streamAnthropic({
        systemPrompt,
        messages,
        temperature,
        maxTokens,
      });
    } else {
      throw error;
    }
  }
}

// --- Internal OpenAI Functions ---

async function callOpenAI(options: {
  systemPrompt: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  temperature: number;
  maxTokens: number;
}): Promise<AgentCallResponse> {
  const response = await openaiClient.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    system: options.systemPrompt,
    messages: options.messages,
    temperature: options.temperature,
    max_tokens: options.maxTokens,
  });

  const content = response.choices[0]?.message?.content || '';

  return {
    content,
    provider: 'openai',
    tokenUsage: {
      inputTokens: response.usage?.prompt_tokens || 0,
      outputTokens: response.usage?.completion_tokens || 0,
      totalTokens: response.usage?.total_tokens || 0,
    },
  };
}

async function* streamOpenAI(options: {
  systemPrompt: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  temperature: number;
  maxTokens: number;
}): AsyncGenerator<string, void, unknown> {
  const stream = await openaiClient.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    system: options.systemPrompt,
    messages: options.messages,
    temperature: options.temperature,
    max_tokens: options.maxTokens,
    stream: true,
  });

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) {
      yield delta;
    }
  }
}

// --- Internal Anthropic Functions ---

async function callAnthropic(options: {
  systemPrompt: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  temperature: number;
  maxTokens: number;
}): Promise<AgentCallResponse> {
  const response = await anthropicClient.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001',
    system: options.systemPrompt,
    messages: options.messages,
    temperature: options.temperature,
    max_tokens: options.maxTokens,
  });

  const content =
    response.content[0]?.type === 'text' ? response.content[0].text : '';

  return {
    content,
    provider: 'anthropic',
    tokenUsage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      totalTokens: response.usage.input_tokens + response.usage.output_tokens,
    },
  };
}

async function* streamAnthropic(options: {
  systemPrompt: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  temperature: number;
  maxTokens: number;
}): AsyncGenerator<string, void, unknown> {
  const stream = await anthropicClient.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001',
    system: options.systemPrompt,
    messages: options.messages,
    temperature: options.temperature,
    max_tokens: options.maxTokens,
    stream: true,
  });

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      yield event.delta.text;
    }
  }
}
