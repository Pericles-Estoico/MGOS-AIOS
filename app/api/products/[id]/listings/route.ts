/**
 * GET  /api/products/[id]/listings — lista listings do produto
 * POST /api/products/[id]/listings — cria listing e dispara análise AI automaticamente
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase';
import type { ProductListingInsert } from '@lib/types/products';

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function assertProductOwner(supabase: ReturnType<typeof createSupabaseServerClient>, productId: string, userId: string) {
  const { data } = await supabase!
    .from('products')
    .select('id')
    .eq('id', productId)
    .eq('created_by', userId)
    .single();
  return !!data;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const supabase = createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: 'Banco indisponível' }, { status: 503 });

  const { id: productId } = await params;

  if (!(await assertProductOwner(supabase, productId, session.user.id))) {
    return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
  }

  const { data, error } = await supabase
    .from('product_listings')
    .select(`*, listing_analyses(id, score, summary, strengths, weaknesses, analyzed_at)`)
    .eq('product_id', productId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ listings: data ?? [] });
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const supabase = createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: 'Banco indisponível' }, { status: 503 });

  const { id: productId } = await params;

  if (!(await assertProductOwner(supabase, productId, session.user.id))) {
    return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
  }

  let body: Partial<ProductListingInsert & { imageBase64?: string; imageMediaType?: string }>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  if (!body.marketplace) {
    return NextResponse.json({ error: 'Marketplace é obrigatório' }, { status: 400 });
  }

  // Cria o listing com status "analyzing"
  const { data: listing, error: insertError } = await supabase
    .from('product_listings')
    .insert({
      product_id: productId,
      marketplace: body.marketplace,
      url: body.url || null,
      title: body.title || null,
      price: body.price || null,
      image_url: body.image_url || null,
      status: 'analyzing',
    })
    .select()
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  // Dispara análise AI de forma assíncrona (não bloqueia resposta)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  fetch(`${baseUrl}/api/products/${productId}/listings/${listing.id}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: request.headers.get('cookie') || '' },
    body: JSON.stringify({
      imageBase64: body.imageBase64,
      imageMediaType: body.imageMediaType,
    }),
  }).catch((err) => console.error('[analyze fire-and-forget]', err));

  return NextResponse.json({ listing }, { status: 201 });
}
