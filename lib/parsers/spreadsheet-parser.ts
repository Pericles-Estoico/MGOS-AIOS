/**
 * Spreadsheet Parser — CSV e XLSX → array de ImportRow
 * Story: STORY-5.4
 */

import * as XLSX from 'xlsx';

export interface ImportRow {
  nome: string;
  categoria?: string;
  marca?: string;
  marketplace?: string;
  url?: string;
  preco?: string;
  _rowIndex: number;
}

export function parseSpreadsheet(buffer: Buffer): ImportRow[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

  return rows
    .map((row, index) => ({
      nome: String(row['nome'] ?? row['name'] ?? row['Nome'] ?? '').trim(),
      categoria: String(row['categoria'] ?? row['category'] ?? row['Categoria'] ?? '').trim() || undefined,
      marca: String(row['marca'] ?? row['brand'] ?? row['Marca'] ?? '').trim() || undefined,
      marketplace: String(row['marketplace'] ?? row['Marketplace'] ?? '').trim().toLowerCase() || undefined,
      url: String(row['url'] ?? row['URL'] ?? '').trim() || undefined,
      preco: String(row['preco'] ?? row['price'] ?? row['Preço'] ?? '').trim() || undefined,
      _rowIndex: index + 2,
    }))
    .filter((r) => r.nome.length > 0);
}

export function getPreviewRows(rows: ImportRow[], count = 5): ImportRow[] {
  return rows.slice(0, count);
}
