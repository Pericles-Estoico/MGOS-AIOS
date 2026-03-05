/**
 * POST /api/products/[id]/listings/[listingId]/analyze
 * Dispara análise AI do listing e salva resultado em listing_analyses.
 * Atualiza listing_score e status em product_listings.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase';
import {
  analyzeListingContent,
  detectMarketplace,
  fetchUrlContent,
  type ListingInput,
} from '@lib/marketplace-orchestration/listing-analyzer';
import type { Marketplace } from '@lib/marketplace-orchestration/types';

interface RouteParams {
  params: Promise<{ id: string; listingId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const supabase = createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: 'Banco indisponível' }, { status: 503 });

  const { id: productId, listingId } = await params;

  // Verifica ownership e carrega listing
  const { data: listing, error: fetchError } = await supabase
    .from('product_listings')
    .select('*, products!inner(created_by)')
    .eq('id', listingId)
    .eq('product_id', productId)
    .single();

  if (fetchError || !listing) {
    return NextResponse.json({ error: 'Listing não encontrado' }, { status: 404 });
  }

  const owner = (listing as { products: { created_by: string } }).products?.created_by;
  if (owner !== session.user.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
  }

  // Seta status "analyzing"
  await supabase
    .from('product_listings')
    .update({ status: 'analyzing' })
    .eq('id', listingId);

  try {
    // Lê imageBase64 do body (opcional — enviado pelo form)
    let imageBase64: string | undefined;
    let imageMediaType: ListingInput['imageMediaType'];

    try {
      const body = await request.json();
      if (body.imageBase64) {
        imageBase64 = body.imageBase64;
        imageMediaType = (body.imageMediaType as ListingInput['imageMediaType']) || 'image/jpeg';
      }
    } catch { /* sem body — ok */ }

    // Extrai conteúdo da URL pública (se existir)
    let urlContent: string | undefined;
    let detectedMarketplace: Marketplace | null = listing.marketplace as Marketplace;

    if (listing.url) {
      if (!detectedMarketplace) {
        detectedMarketplace = detectMarketplace(listing.url) as Marketplace | null;
      }
      urlContent = await fetchUrlContent(listing.url);
    }

    const listingInput: ListingInput = {
      imageBase64,
      imageMediaType,
      url: listing.url || undefined,
      urlContent,
      marketplace: detectedMarketplace || undefined,
    };

    // Análise AI
    const analysis = await analyzeListingContent(listingInput);

    // Salva em listing_analyses
    const { data: savedAnalysis } = await supabase
      .from('listing_analyses')
      .insert({
        listing_id: listingId,
        score: analysis.listingScore,
        summary: analysis.summary,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        analysis_data: {
          marketplace: analysis.marketplace,
          agentId: analysis.agentId,
          tasks: analysis.tasks,
        },
      })
      .select()
      .single();

    // Atualiza score e status do listing
    await supabase
      .from('product_listings')
      .update({
        listing_score: analysis.listingScore,
        status: 'active',
        title: listing.title || undefined,
      })
      .eq('id', listingId);

    // Cria tasks de otimização vinculadas ao listing
    const taskInserts = analysis.tasks.map((task) => ({
      title: task.title,
      description: task.description,
      category: task.category,
      priority: task.priority,
      estimated_hours: task.estimatedHours,
      marketplace: analysis.marketplace,
      created_by_agent: analysis.agentId,
      source_type: 'ai_generated',
      status: 'pending',
      listing_id: listingId,
      tags: ['listing-analysis'],
      metadata: {
        source: {
          type: 'listing_analysis',
          listing_id: listingId,
          product_id: productId,
          listing_score: analysis.listingScore,
          analyzed_at: new Date().toISOString(),
        },
      },
    }));

    if (taskInserts.length > 0) {
      await supabase.from('marketplace_tasks').insert(taskInserts);
    }

    return NextResponse.json({
      success: true,
      analysis: {
        id: savedAnalysis?.id,
        score: analysis.listingScore,
        summary: analysis.summary,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
      },
      tasksCreated: taskInserts.length,
    });
  } catch (error) {
    // Em caso de erro, volta listing para "active" sem score
    await supabase
      .from('product_listings')
      .update({ status: 'active' })
      .eq('id', listingId);

    const msg = error instanceof Error ? error.message : String(error);
    console.error('[analyze route]', error);
    return NextResponse.json({ error: `Falha na análise: ${msg}` }, { status: 500 });
  }
}
