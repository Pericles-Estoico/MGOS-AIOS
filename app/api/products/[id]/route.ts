/**
 * PUT    /api/products/[id] — atualiza produto
 * DELETE /api/products/[id] — remove produto (CASCADE: listings + analyses)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase';
import type { ProductUpdate } from '@lib/types/products';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Banco indisponível' }, { status: 503 });
  }

  const { id } = await params;

  let body: Partial<ProductUpdate>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  // Só atualiza campos permitidos
  const updates: ProductUpdate = {};
  if (body.name !== undefined) updates.name = body.name.trim();
  if (body.description !== undefined) updates.description = body.description?.trim() || null;
  if (body.category !== undefined) updates.category = body.category?.trim() || null;
  if (body.brand !== undefined) updates.brand = body.brand?.trim() || null;

  if (updates.name !== undefined && !updates.name) {
    return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .eq('created_by', session.user.id) // garante ownership via query (RLS também cobre)
    .select()
    .single();

  if (error) {
    console.error('[PUT /api/products/:id]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
  }

  return NextResponse.json({ product: data });
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Banco indisponível' }, { status: 503 });
  }

  const { id } = await params;

  // CASCADE no banco remove listings e analyses automaticamente
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
    .eq('created_by', session.user.id);

  if (error) {
    console.error('[DELETE /api/products/:id]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
