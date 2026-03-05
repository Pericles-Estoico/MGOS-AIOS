/**
 * GET    /api/products/[id]/listings/[listingId]
 * PUT    /api/products/[id]/listings/[listingId]
 * DELETE /api/products/[id]/listings/[listingId]
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase';

interface RouteParams {
  params: Promise<{ id: string; listingId: string }>;
}

async function assertOwnership(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  productId: string,
  listingId: string,
  userId: string
) {
  const { data } = await supabase!
    .from('product_listings')
    .select('id, products!inner(created_by)')
    .eq('id', listingId)
    .eq('product_id', productId)
    .single();
  const row = data as { id: string; products: { created_by: string } } | null;
  return row?.products?.created_by === userId ? row : null;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const supabase = createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: 'Banco indisponível' }, { status: 503 });

  const { id: productId, listingId } = await params;

  if (!(await assertOwnership(supabase, productId, listingId, session.user.id))) {
    return NextResponse.json({ error: 'Listing não encontrado' }, { status: 404 });
  }

  const { data, error } = await supabase
    .from('product_listings')
    .select(`*, listing_analyses(*)`)
    .eq('id', listingId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ listing: data });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const supabase = createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: 'Banco indisponível' }, { status: 503 });

  const { id: productId, listingId } = await params;

  if (!(await assertOwnership(supabase, productId, listingId, session.user.id))) {
    return NextResponse.json({ error: 'Listing não encontrado' }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Body inválido' }, { status: 400 }); }

  const allowed = ['url', 'title', 'price', 'image_url', 'status'];
  const updates = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)));

  const { data, error } = await supabase
    .from('product_listings')
    .update(updates)
    .eq('id', listingId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ listing: data });
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const supabase = createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: 'Banco indisponível' }, { status: 503 });

  const { id: productId, listingId } = await params;

  if (!(await assertOwnership(supabase, productId, listingId, session.user.id))) {
    return NextResponse.json({ error: 'Listing não encontrado' }, { status: 404 });
  }

  const { error } = await supabase.from('product_listings').delete().eq('id', listingId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
