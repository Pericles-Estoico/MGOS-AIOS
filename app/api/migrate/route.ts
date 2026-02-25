/**
 * TEMPORARY migration endpoint — remove after use
 * GET  /api/migrate        → verifica se tabela existe
 * POST /api/migrate        → body: { secret: "nexo-migrate-2026" } → cria tabela
 */
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@lib/supabase';

const MIGRATE_SECRET = 'nexo-migrate-2026';

export async function GET() {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ configured: false, error: 'Supabase not configured' });
  }

  const { data, error } = await supabase
    .from('marketplace_tasks')
    .select('id')
    .limit(1);

  return NextResponse.json({
    table_exists: error === null,
    error: error?.message ?? null,
    supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'not set',
    service_key_set: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { secret?: string };
    if (body.secret !== MIGRATE_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured — check SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 });
    }

    // Verificar se a tabela já existe
    const { error: checkError } = await supabase
      .from('marketplace_tasks')
      .select('id')
      .limit(1);

    if (checkError === null) {
      return NextResponse.json({ success: true, message: '✅ Tabela marketplace_tasks já existe!' });
    }

    // Tentar criar via exec_sql (função customizada, se disponível)
    const { error: rpcError } = await supabase.rpc('exec_sql', {
      sql: `CREATE TABLE IF NOT EXISTS public.marketplace_tasks (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title VARCHAR(500) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(50) NOT NULL DEFAULT 'optimization',
        marketplace VARCHAR(50) NOT NULL,
        channel VARCHAR(50) GENERATED ALWAYS AS (marketplace) STORED,
        created_by_agent VARCHAR(50) NOT NULL,
        source_type VARCHAR(50) NOT NULL DEFAULT 'ai_generated',
        plan_id VARCHAR(100),
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        admin_approved BOOLEAN NOT NULL DEFAULT false,
        approved_by UUID,
        approved_at TIMESTAMP WITH TIME ZONE,
        rejected_by UUID,
        rejected_at TIMESTAMP WITH TIME ZONE,
        rejection_reason TEXT,
        assigned_to UUID,
        assigned_by UUID,
        started_at TIMESTAMP WITH TIME ZONE,
        completed_at TIMESTAMP WITH TIME ZONE,
        completed_by UUID,
        completion_notes TEXT,
        priority VARCHAR(20) NOT NULL DEFAULT 'medium',
        estimated_hours NUMERIC(5,1) DEFAULT 4.0,
        actual_hours NUMERIC(5,1),
        due_date DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        submitted_at TIMESTAMP WITH TIME ZONE,
        tags TEXT[],
        metadata JSONB DEFAULT '{}'
      )`,
    });

    // Verificar resultado
    const { error: verifyError } = await supabase
      .from('marketplace_tasks')
      .select('id')
      .limit(1);

    if (verifyError === null) {
      return NextResponse.json({ success: true, message: '✅ Tabela criada com sucesso!' });
    }

    return NextResponse.json({
      success: false,
      rpc_error: rpcError?.message ?? null,
      verify_error: verifyError?.message ?? null,
      message: 'Não foi possível criar automaticamente. Rode o SQL manualmente.',
    }, { status: 500 });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
