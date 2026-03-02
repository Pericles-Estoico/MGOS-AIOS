import { NextRequest, NextResponse } from 'next/server';

interface ProdutoExtraido {
  titulo: string;
  preco: string;
  imagem?: string;
  descricao?: string;
}

async function extrairDados(url: string): Promise<ProdutoExtraido> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    }).catch(() => null);

    if (!response) {
      return {
        titulo: 'Produto do Marketplace',
        preco: 'A consultar',
      };
    }

    const html = await response.text();

    // Extrair título
    const tituloMatch = html.match(/<title>([^<]+)<\/title>/) || html.match(/<h1[^>]*>([^<]+)<\/h1>/);
    const titulo = tituloMatch ? tituloMatch[1].trim().substring(0, 100) : 'Produto';

    // Extrair preço
    const precoMatch = html.match(/R\$\s?[\d.,]+|[\$]?\s?[\d,]+\.?\d{2}/);
    const preco = precoMatch ? precoMatch[0] : 'A consultar';

    return {
      titulo,
      preco,
    };
  } catch (error) {
    console.error('Erro ao extrair dados:', error);
    return {
      titulo: 'Produto do Marketplace',
      preco: 'A consultar',
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL não fornecida' }, { status: 400 });
    }

    const dados = await extrairDados(url);
    return NextResponse.json(dados);
  } catch (error) {
    console.error('Erro na API:', error);
    return NextResponse.json({
      titulo: 'Produto',
      preco: 'A consultar',
    });
  }
}
