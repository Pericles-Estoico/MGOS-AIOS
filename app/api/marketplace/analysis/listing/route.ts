/**
 * POST /api/marketplace/analysis/listing
 * Analisa listing de marketplace via imagem (screenshot) e/ou URL.
 * Retorna relatório estruturado + tasks geradas para aprovação humana.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import {
  analyzeListingContent,
  detectMarketplace,
  fetchUrlContent,
  type ListingInput,
} from '@lib/marketplace-orchestration/listing-analyzer';
import { TaskManager } from '@lib/marketplace-orchestration/task-manager';
import type { Marketplace } from '@lib/marketplace-orchestration/types';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function POST(request: NextRequest) {
  // Auth
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File | null;
    const url = formData.get('url') as string | null;
    const marketplaceOverride = formData.get('marketplace') as Marketplace | null;

    // Validação: pelo menos um input
    if (!imageFile && !url) {
      return NextResponse.json(
        { error: 'Forneça uma imagem ou URL para análise' },
        { status: 400 }
      );
    }

    // Validação da imagem
    let imageBase64: string | undefined;
    let imageMediaType: ListingInput['imageMediaType'];

    if (imageFile) {
      if (!ALLOWED_IMAGE_TYPES.includes(imageFile.type)) {
        return NextResponse.json(
          { error: `Tipo de imagem não suportado. Use: ${ALLOWED_IMAGE_TYPES.join(', ')}` },
          { status: 400 }
        );
      }
      if (imageFile.size > MAX_IMAGE_SIZE) {
        return NextResponse.json(
          { error: 'Imagem muito grande. Máximo: 5MB' },
          { status: 400 }
        );
      }
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      imageBase64 = buffer.toString('base64');
      imageMediaType = imageFile.type as ListingInput['imageMediaType'];
    }

    // Validação e extração da URL
    let urlContent: string | undefined;
    let detectedMarketplace = marketplaceOverride;

    if (url) {
      try {
        new URL(url); // valida URL
      } catch {
        return NextResponse.json({ error: 'URL inválida' }, { status: 400 });
      }

      if (!detectedMarketplace) {
        detectedMarketplace = detectMarketplace(url) as Marketplace | null;
      }

      urlContent = await fetchUrlContent(url);
    }

    // Análise
    const listingInput: ListingInput = {
      imageBase64,
      imageMediaType,
      url: url || undefined,
      urlContent,
      marketplace: detectedMarketplace || undefined,
    };

    const analysis = await analyzeListingContent(listingInput);

    // Salva tasks no Supabase
    const taskManager = new TaskManager();
    const createdTasks = [];

    for (const task of analysis.tasks) {
      try {
        const created = await taskManager.createTask({
          marketplace: analysis.marketplace,
          createdBy: analysis.agentId,
          title: task.title,
          description: task.description,
          category: task.category,
          priority: task.priority,
          estimatedHours: task.estimatedHours,
          status: 'pending',
          tags: ['listing-analysis'],
          metadata: {
            source: {
              type: 'listing_analysis',
              url: url || null,
              imageProvided: !!imageBase64,
              listingScore: analysis.listingScore,
              analyzedAt: new Date().toISOString(),
            },
          },
        });
        createdTasks.push(created);
      } catch (taskError) {
        console.error('Erro ao criar task:', taskError);
        // Continua mesmo se falhar uma task individual
      }
    }

    return NextResponse.json({
      success: true,
      analysis: {
        marketplace: analysis.marketplace,
        agentId: analysis.agentId,
        listingScore: analysis.listingScore,
        summary: analysis.summary,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
      },
      tasks: createdTasks,
      tasksCount: createdTasks.length,
      detectedMarketplace: analysis.marketplace,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    console.error('[listing/route] Erro:', error);
    return NextResponse.json(
      { error: `Falha na análise: ${message}` },
      { status: 500 }
    );
  }
}
