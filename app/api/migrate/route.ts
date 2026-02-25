/**
 * TEMPORARY migration endpoint — remove after use
 * POST /api/migrate   body: { secret: "nexo-migrate-2026" }
 */
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@lib/supabase';

const MIGRATE_SECRET = 'nexo-migrate-2026';

const SQL = `
CREATE TABLE IF NOT EXISTS public.marketplace_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'optimization'
    CHECK (category IN ('optimization', 'best-practice', 'scaling', 'analysis')),
  marketplace VARCHAR(50) NOT NULL
    CHECK (marketplace IN ('amazon', 'mercadolivre', 'shopee', 'shein', 'tiktokshop', 'kaway', 'general')),
  channel VARCHAR(50) GENERATED ALWAYS AS (marketplace) STORED,
  created_by_agent VARCHAR(50) NOT NULL
    CHECK (created_by_agent IN ('alex', 'marina', 'sunny', 'tren', 'viral', 'premium', 'nexo')),
  source_type VARCHAR(50) NOT NULL DEFAULT 'ai_generated',
  plan_id VARCHAR(100),
  status VARCHAR(50) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'awaiting_approval', 'approved', 'rejected', 'in_progress', 'completed', 'cancelled')),
  admin_approved BOOLEAN NOT NULL DEFAULT false,
  approved_by UUID REFERENCES public.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_by UUID REFERENCES public.users(id),
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  assigned_to UUID REFERENCES public.users(id),
  assigned_by UUID REFERENCES public.users(id),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES public.users(id),
  completion_notes TEXT,
  priority VARCHAR(20) NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('high', 'medium', 'low')),
  estimated_hours NUMERIC(5,1) DEFAULT 4.0,
  actual_hours NUMERIC(5,1),
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  tags TEXT[],
  metadata JSONB DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_mp_tasks_status ON public.marketplace_tasks(status);
CREATE INDEX IF NOT EXISTS idx_mp_tasks_marketplace ON public.marketplace_tasks(marketplace);
CREATE INDEX IF NOT EXISTS idx_mp_tasks_agent ON public.marketplace_tasks(created_by_agent);
CREATE INDEX IF NOT EXISTS idx_mp_tasks_created_at ON public.marketplace_tasks(created_at DESC);
ALTER TABLE public.marketplace_tasks ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='marketplace_tasks' AND policyname='marketplace_tasks_select') THEN
    CREATE POLICY "marketplace_tasks_select" ON public.marketplace_tasks FOR SELECT USING (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='marketplace_tasks' AND policyname='marketplace_tasks_insert') THEN
    CREATE POLICY "marketplace_tasks_insert" ON public.marketplace_tasks FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='marketplace_tasks' AND policyname='marketplace_tasks_update') THEN
    CREATE POLICY "marketplace_tasks_update" ON public.marketplace_tasks FOR UPDATE USING (auth.uid() IS NOT NULL);
  END IF;
END $$;
`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (body.secret !== MIGRATE_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    // Executa o SQL via rpc ou direto
    const { error } = await supabase.rpc('exec_sql', { sql: SQL }).throwOnError().catch(async () => {
      // Se exec_sql não existe, tenta criar a tabela via insert com fallback
      return { error: new Error('exec_sql not available') };
    });

    // Verifica se a tabela já existe (independente do método)
    const { data: tableCheck } = await supabase
      .from('marketplace_tasks')
      .select('id')
      .limit(1);

    if (tableCheck !== null) {
      return NextResponse.json({
        success: true,
        message: '✅ Tabela marketplace_tasks já existe ou foi criada com sucesso!',
      });
    }

    return NextResponse.json({
      success: false,
      error: error?.message || 'Tabela não foi criada',
      hint: 'Rode o SQL manualmente no Supabase SQL Editor',
    }, { status: 500 });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);

    // Se o erro é "table already exists", é sucesso
    if (msg.includes('already exists') || msg.includes('marketplace_tasks')) {
      return NextResponse.json({ success: true, message: '✅ Tabela já existe!' });
    }

    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function GET() {
  const supabase = createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ configured: false });

  const { data, error } = await supabase
    .from('marketplace_tasks')
    .select('id')
    .limit(1);

  return NextResponse.json({
    table_exists: data !== null,
    error: error?.message,
    supabase_configured: true,
  });
}
