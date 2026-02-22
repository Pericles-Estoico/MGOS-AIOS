import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { runAnalysisPlan } from '@/lib/ai/agent-loop';

const VALID_CHANNELS = [
  'amazon',
  'mercadolivre',
  'shopee',
  'shein',
  'tiktok-shop',
  'kaway',
];

/**
 * POST /api/marketplace/analysis/run
 * Trigger strategic analysis for specified channels
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Authorization check (admin/head only)
    const userRole = session.user?.role as string;
    if (!['admin', 'head'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Apenas admin e head podem disparar análises' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { channels, scheduled } = body;

    // Validate channels
    if (!Array.isArray(channels) || channels.length === 0) {
      return NextResponse.json(
        { error: 'Canais inválidos. Forneca um array não vazio.' },
        { status: 400 }
      );
    }

    const invalidChannels = channels.filter(
      (ch: string) => !VALID_CHANNELS.includes(ch)
    );
    if (invalidChannels.length > 0) {
      return NextResponse.json(
        {
          error: `Canais inválidos: ${invalidChannels.join(', ')}`,
          validChannels: VALID_CHANNELS
        },
        { status: 400 }
      );
    }

    // Run analysis
    console.log(`Iniciando análise para canais: ${channels.join(', ')}`);
    const result = await runAnalysisPlan(channels, scheduled === true);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error in analysis run:', error);
    return NextResponse.json(
      {
        error: 'Erro ao disparar análise',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
