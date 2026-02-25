import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { runAnalysisPlanWithContext } from '@/lib/ai/agent-loop';

const VALID_CHANNELS = [
  'amazon',
  'mercadolivre',
  'shopee',
  'shein',
  'tiktok-shop',
  'kaway',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'text/plain',
  'text/csv',
  'application/json',
  'application/pdf',
];

/**
 * Extract text from uploaded file
 * Supports: TXT, CSV, JSON (direct text)
 * PDF: Attempts to extract text using Buffer.toString()
 */
async function extractTextFromFile(file: File, mimeType: string): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());

  if (mimeType === 'application/pdf') {
    // Try direct buffer to string conversion (works for PDFs with text content)
    const text = buffer.toString('utf8');
    // Check if extraction resulted in readable text
    const readableChars = text.match(/[a-zA-Z0-9\s\n\r]/g)?.length || 0;
    const totalChars = text.length;

    if (readableChars / totalChars > 0.3) {
      // At least 30% of content is readable
      return text.trim();
    }

    throw new Error(
      'PDF contém apenas imagens ou conteúdo não-texto. Use TXT, CSV ou JSON.'
    );
  }

  // For text-based formats (TXT, CSV, JSON)
  return buffer.toString('utf8');
}

/**
 * POST /api/marketplace/analysis/upload
 * Upload file and trigger strategic analysis with context
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
        { error: 'Apenas admin e head podem fazer upload de análises' },
        { status: 403 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const channelsParam = formData.get('channels') as string | null;

    // Validate file
    if (!file) {
      return NextResponse.json(
        { error: 'Arquivo não fornecido' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Arquivo muito grande. Máximo: 10MB. Tamanho: ${(file.size / 1024 / 1024).toFixed(1)}MB` },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Tipo de arquivo não suportado: ${file.type}`,
          allowed: ALLOWED_MIME_TYPES,
        },
        { status: 400 }
      );
    }

    // Validate channels
    if (!channelsParam) {
      return NextResponse.json(
        { error: 'Canais não fornecidos' },
        { status: 400 }
      );
    }

    let channels: string[];
    try {
      channels = JSON.parse(channelsParam);
    } catch {
      return NextResponse.json(
        { error: 'Canais inválidos. Forneca um JSON array.' },
        { status: 400 }
      );
    }

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
          validChannels: VALID_CHANNELS,
        },
        { status: 400 }
      );
    }

    // Extract text from file
    console.log(`Extraindo texto do arquivo: ${file.name} (${file.type})`);
    let fileContext: string;
    try {
      fileContext = await extractTextFromFile(file, file.type);
    } catch (error) {
      return NextResponse.json(
        {
          error: 'Erro ao extrair texto do arquivo',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 400 }
      );
    }

    if (!fileContext || fileContext.trim().length === 0) {
      return NextResponse.json(
        { error: 'Arquivo vazio ou sem conteúdo legível' },
        { status: 400 }
      );
    }

    // Run analysis with context
    console.log(
      `Iniciando análise com contexto para canais: ${channels.join(', ')}`
    );
    const result = await runAnalysisPlanWithContext(
      channels,
      fileContext,
      file.name
    );

    return NextResponse.json(
      {
        ...result,
        fileName: file.name,
        fileSize: file.size,
        extractedChars: fileContext.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in analysis upload:', error);
    return NextResponse.json(
      {
        error: 'Erro ao processar upload de análise',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
