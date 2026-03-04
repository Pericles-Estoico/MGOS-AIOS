/**
 * Listing Analyzer — Analisa listings de marketplace via imagem ou URL
 * Usa Vision AI (Anthropic primary, OpenAI fallback) para extrair insights
 * e gerar tarefas de otimização para o agente especialista do canal.
 */

import { callAgentWithVision, type VisionContent } from '@lib/ai/agent-client';
import { getAgentPrompt, type AgentRole } from '@lib/ai/agent-prompts';
import type { Marketplace, TaskCategory, TaskPriority } from './types';

// --- Types ---

export interface ListingInput {
  imageBase64?: string;
  imageMediaType?: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';
  url?: string;
  urlContent?: string; // texto extraído da URL
  marketplace?: Marketplace;
}

export interface GeneratedTask {
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  estimatedHours: number;
}

export interface ListingAnalysis {
  marketplace: Marketplace;
  agentId: AgentRole;
  listingScore: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  tasks: GeneratedTask[];
}

// --- Marketplace Detection ---

const MARKETPLACE_DOMAINS: Record<string, Marketplace> = {
  'amazon.com.br': 'amazon',
  'amazon.com': 'amazon',
  'mercadolivre.com.br': 'mercadolivre',
  'mercadolibre.com': 'mercadolivre',
  'shopee.com.br': 'shopee',
  'shein.com': 'shein',
  'shein.com.br': 'shein',
  'tiktok.com': 'tiktokshop',
  'shop.tiktok.com': 'tiktokshop',
  'kaway.com.br': 'kaway',
};

const MARKETPLACE_TO_AGENT: Record<Marketplace, AgentRole> = {
  amazon: 'alex',
  mercadolivre: 'marina',
  shopee: 'sunny',
  shein: 'tren',
  tiktokshop: 'viral',
  kaway: 'premium',
};

export function detectMarketplace(url: string): Marketplace | null {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    for (const [domain, marketplace] of Object.entries(MARKETPLACE_DOMAINS)) {
      if (hostname === domain || hostname.endsWith(`.${domain}`)) {
        return marketplace;
      }
    }
    return null;
  } catch {
    return null;
  }
}

// --- URL Content Extraction ---

export async function fetchUrlContent(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();

    // Remove scripts, styles, tags — extrai texto puro
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();

    // Limita a 3000 chars para não estourar contexto
    return text.slice(0, 3000);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return `[Erro ao acessar URL: ${msg}. O marketplace pode bloquear acesso direto. Use a análise por imagem.]`;
  }
}

// --- Vision Prompt ---

function buildListingAnalysisPrompt(agentId: AgentRole): string {
  const agentPrompt = getAgentPrompt(agentId);

  return `${agentPrompt}

=== MODO: ANÁLISE DE LISTING ===

Você receberá conteúdo de um produto (screenshot ou texto extraído de URL).
Analise o listing como especialista e retorne SOMENTE um JSON válido com esta estrutura:

{
  "marketplace": "amazon|mercadolivre|shopee|shein|tiktokshop|kaway",
  "listingScore": <número 0-100>,
  "summary": "<análise geral em 2-3 frases>",
  "strengths": ["<ponto forte 1>", "<ponto forte 2>", "<ponto forte 3>"],
  "weaknesses": ["<melhoria necessária 1>", "<melhoria necessária 2>", "<melhoria necessária 3>"],
  "tasks": [
    {
      "title": "<título da ação>",
      "description": "<descrição detalhada do que fazer e por quê>",
      "category": "optimization|best-practice|scaling|analysis",
      "priority": "high|medium|low",
      "estimatedHours": <número>
    }
  ]
}

Gere de 3 a 6 tasks priorizadas. Foque em ações concretas e acionáveis.
Considere sempre: INMETRO, tabela de medidas, sazonalidade de moda infantil.
RETORNE APENAS O JSON, sem texto adicional antes ou depois.`;
}

// --- Core Analysis ---

export async function analyzeListingContent(input: ListingInput): Promise<ListingAnalysis> {
  const marketplace = input.marketplace ||
    (input.url ? detectMarketplace(input.url) : null) ||
    'amazon'; // fallback para nexo/geral

  const agentId = MARKETPLACE_TO_AGENT[marketplace] || 'nexo';
  const systemPrompt = buildListingAnalysisPrompt(agentId as AgentRole);

  // Monta content blocks para vision
  const content: VisionContent[] = [];

  // Texto introdutório
  let contextText = `Analise o seguinte listing de produto no marketplace ${marketplace}:\n\n`;

  if (input.url) {
    contextText += `URL: ${input.url}\n`;
  }

  if (input.urlContent) {
    contextText += `\nConteúdo da página:\n${input.urlContent}`;
  }

  content.push({ type: 'text', text: contextText });

  // Imagem (se fornecida)
  if (input.imageBase64 && input.imageMediaType) {
    content.push({
      type: 'image_base64',
      imageBase64: input.imageBase64,
      mediaType: input.imageMediaType,
    });
    content.push({
      type: 'text',
      text: 'A imagem acima é um screenshot do listing. Analise todos os elementos visíveis: título, preço, imagens, descrição, avaliações, badges.',
    });
  }

  const response = await callAgentWithVision({
    systemPrompt,
    content,
    provider: 'anthropic',
    maxTokens: 4000,
  });

  // Parse JSON da resposta
  const jsonMatch = response.content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Agente não retornou JSON válido na análise');
  }

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    marketplace: (parsed.marketplace as Marketplace) || marketplace,
    agentId: agentId as AgentRole,
    listingScore: Math.max(0, Math.min(100, Number(parsed.listingScore) || 50)),
    summary: parsed.summary || '',
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
    weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
    tasks: Array.isArray(parsed.tasks) ? parsed.tasks.map((t: GeneratedTask) => ({
      title: t.title || '',
      description: t.description || '',
      category: t.category || 'optimization',
      priority: t.priority || 'medium',
      estimatedHours: Number(t.estimatedHours) || 2,
    })) : [],
  };
}
