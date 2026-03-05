/**
 * POST /api/products/import
 * Import em lote: CSV, XLSX, PDF, DOCX
 * Story: STORY-5.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase';
import { parseSpreadsheet, type ImportRow } from '@lib/parsers/spreadsheet-parser';
import {
  extractTextFromPdf,
  extractTextFromDocx,
  identifyProductsFromText,
} from '@lib/parsers/document-parser';
import { callAgent } from '@lib/ai/agent-client';

const IMPORT_LIMIT = 50;

const VALID_MARKETPLACES = ['amazon', 'mercadolivre', 'shopee', 'shein', 'tiktokshop', 'kaway'];

interface ImportResult {
  productsCreated: number;
  listingsCreated: number;
  analysisQueued: number;
  errors: Array<{ row: number | string; message: string }>;
}

async function processRows(
  rows: ImportRow[],
  userId: string,
  supabase: ReturnType<typeof createSupabaseServerClient>
): Promise<ImportResult> {
  const result: ImportResult = { productsCreated: 0, listingsCreated: 0, analysisQueued: 0, errors: [] };
  if (!supabase) return result;

  const limited = rows.slice(0, IMPORT_LIMIT);

  for (const row of limited) {
    try {
      // Cria produto
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          name: row.nome,
          category: row.categoria || null,
          brand: row.marca || null,
          description: null,
          created_by: userId,
        })
        .select()
        .single();

      if (productError || !product) {
        result.errors.push({ row: row._rowIndex, message: productError?.message || 'Erro ao criar produto' });
        continue;
      }
      result.productsCreated++;

      // Cria listing se marketplace informado
      if (row.marketplace && VALID_MARKETPLACES.includes(row.marketplace)) {
        const { data: listing, error: listingError } = await supabase
          .from('product_listings')
          .insert({
            product_id: product.id,
            marketplace: row.marketplace,
            url: row.url || null,
            price: row.preco || null,
            status: row.url ? 'analyzing' : 'active',
          })
          .select()
          .single();

        if (listingError || !listing) {
          result.errors.push({ row: row._rowIndex, message: `Listing: ${listingError?.message}` });
        } else {
          result.listingsCreated++;

          // Dispara análise em background para listings com URL
          if (row.url && listing.id) {
            fetch(
              `${process.env.NEXTAUTH_URL}/api/products/${product.id}/listings/${listing.id}/analyze`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-internal': 'import' },
                body: JSON.stringify({}),
              }
            ).catch(() => {
              // fire-and-forget — não bloqueia o import
            });
            result.analysisQueued++;
          }
        }
      }
    } catch (err) {
      result.errors.push({
        row: row._rowIndex,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return result;
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

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  const previewOnly = formData.get('preview') === 'true';

  if (!file) {
    return NextResponse.json({ error: 'Arquivo não fornecido' }, { status: 400 });
  }

  const fileName = file.name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  // CSV ou XLSX
  if (fileName.endsWith('.csv') || fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    let rows: ImportRow[];
    try {
      rows = parseSpreadsheet(buffer);
    } catch (err) {
      return NextResponse.json({ error: `Erro ao ler planilha: ${err instanceof Error ? err.message : String(err)}` }, { status: 400 });
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Planilha vazia ou sem coluna "nome"' }, { status: 400 });
    }

    // Preview: retorna primeiras 5 linhas sem salvar
    if (previewOnly) {
      return NextResponse.json({ preview: rows.slice(0, 5), total: rows.length });
    }

    const result = await processRows(rows, session.user.id, supabase);
    return NextResponse.json({
      success: true,
      type: 'spreadsheet',
      totalRows: rows.length,
      ...result,
    });
  }

  // PDF
  if (fileName.endsWith('.pdf')) {
    let text: string;
    try {
      text = await extractTextFromPdf(buffer);
    } catch (err) {
      return NextResponse.json({ error: `Erro ao ler PDF: ${err instanceof Error ? err.message : String(err)}` }, { status: 400 });
    }

    if (!text || text.length < 20) {
      return NextResponse.json({ error: 'PDF sem texto legível. Tente um arquivo com texto selecionável.' }, { status: 400 });
    }

    const cards = await identifyProductsFromText(text, (prompt) =>
      callAgent({
        systemPrompt: 'Você é um assistente especializado em identificar produtos em documentos. Retorne sempre JSON válido.',
        userMessage: prompt,
        provider: 'anthropic',
        maxTokens: 2000,
      }).then((r) => r.content)
    );

    return NextResponse.json({ success: true, type: 'document', cards });
  }

  // DOCX
  if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
    let text: string;
    try {
      text = await extractTextFromDocx(buffer);
    } catch (err) {
      return NextResponse.json({ error: `Erro ao ler documento: ${err instanceof Error ? err.message : String(err)}` }, { status: 400 });
    }

    if (!text || text.length < 20) {
      return NextResponse.json({ error: 'Documento sem texto legível.' }, { status: 400 });
    }

    const cards = await identifyProductsFromText(text, (prompt) =>
      callAgent({
        systemPrompt: 'Você é um assistente especializado em identificar produtos em documentos. Retorne sempre JSON válido.',
        userMessage: prompt,
        provider: 'anthropic',
        maxTokens: 2000,
      }).then((r) => r.content)
    );

    return NextResponse.json({ success: true, type: 'document', cards });
  }

  return NextResponse.json(
    { error: 'Formato não suportado. Use: .csv, .xlsx, .pdf, .docx' },
    { status: 400 }
  );
}
