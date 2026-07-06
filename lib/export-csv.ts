export interface CsvColumn {
  key: string;
  label: string;
}

function escapeCell(value: unknown): string {
  const s = String(value ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function downloadCSV(
  filename: string,
  rows: Record<string, unknown>[],
  columns: CsvColumn[]
): void {
  const header = columns.map((c) => escapeCell(c.label)).join(',');
  const body = rows
    .map((row) => columns.map((c) => escapeCell(row[c.key])).join(','))
    .join('\n');

  // UTF-8 BOM ensures Excel opens with correct encoding on Windows/Mac
  const csv = '﻿' + header + '\n' + body;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}
