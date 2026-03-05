/**
 * Document Parser — PDF e DOCX → texto extraído
 * Story: STORY-5.4
 */

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string }>;
  const data = await pdfParse(buffer);
  return data.text.trim();
}

export async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  const mammoth = await import('mammoth');
  const { value } = await mammoth.extractRawText({ buffer });
  return value.trim();
}

export interface DocumentProductCard {
  nome: string;
  categoria?: string;
  marca?: string;
  descricao?: string;
}

export async function identifyProductsFromText(
  text: string,
  callAgentFn: (prompt: string) => Promise<string>
): Promise<DocumentProductCard[]> {
  const prompt = `Analise o texto abaixo e extraia uma lista de produtos mencionados.
Para cada produto, retorne um JSON array com objetos contendo: nome, categoria (opcional), marca (opcional), descricao (opcional).
Retorne APENAS o JSON array, sem texto adicional.

Texto:
${text.slice(0, 8000)}`;

  try {
    const response = await callAgentFn(prompt);
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    return JSON.parse(jsonMatch[0]) as DocumentProductCard[];
  } catch {
    return [];
  }
}
