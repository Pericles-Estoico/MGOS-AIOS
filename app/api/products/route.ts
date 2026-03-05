/**
 * GET  /api/products — lista produtos do usuário logado
 * POST /api/products — cria novo produto
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase';
import type { ProductInsert } from '@lib/types/products';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Banco indisponível' }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const includeListings = searchParams.get('include') === 'listings';

  const selectQuery = includeListings
    ? `*, product_listings(*, listing_analyses(id, score, summary, strengths, weaknesses, analyzed_at))`
    : `*, product_listings(id, marketplace, listing_score, status)`;

  const { data, error } = await supabase
    .from('products')
    .select(selectQuery)
    .eq('created_by', session.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[GET /api/products]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Calcula stats por produto
  const products = (data ?? []).map((p) => {
    const listings = p.product_listings ?? [];
    const scores = listings
      .map((l: { listing_score: number | null }) => l.listing_score)
      .filter((s: number | null): s is number => s !== null);
    return {
      ...p,
      listings_count: listings.length,
      avg_score: scores.length ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : null,
    };
  });

  return NextResponse.json({ products });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Banco indisponível' }, { status: 503 });
  }

  let body: Partial<ProductInsert>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('products')
    .insert({
      name,
      description: body.description?.trim() || null,
      category: body.category?.trim() || null,
      brand: body.brand?.trim() || null,
      created_by: session.user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('[POST /api/products]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ product: data }, { status: 201 });
}
