'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTasksQuery } from '@/hooks/use-tasks-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader, FileText, TrendingUp } from 'lucide-react';

interface ReportData {
  type: string;
  summary: Record<string, any>;
  generatedAt: string;
  [key: string]: any;
}

type ReportType = 'sprint' | 'team' | 'individual' | 'custom';

const reportTypes = [
  { value: 'sprint', label: 'Relatório de Sprint' },
  { value: 'team', label: 'Desempenho do Time' },
  { value: 'individual', label: 'Desempenho Individual' },
  { value: 'custom', label: 'Relatório Customizado' },
];

export default function ReportsPage() {
  const { data: session } = useSession();
  const [selectedReport, setSelectedReport] = useState<ReportType>('sprint');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: sprints } = useTasksQuery('/api/sprints');
  const { data: users } = useTasksQuery('/api/users');

  if (!session || !['admin', 'head'].includes(session?.user?.role || '')) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">Acesso negado</p>
      </div>
    );
  }

  const generateReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = { type: selectedReport, ...filters };
      const response = await globalThis.fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!response.ok) throw new Error('Falha ao gerar relatório');
      const result = await response.json();
      setReportData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!reportData) return;
    const csvContent = [
      ['Relatório de ' + reportData.type],
      [],
      ...Object.entries(reportData.summary || {}).map(([key, value]) => [key, String(value)]),
    ].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-6 h-6" />
        <h1 className="text-3xl font-bold">Relatórios</h1>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Tipo de Relatório</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {reportTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => setSelectedReport(type.value as ReportType)}
              className={`p-3 rounded-lg border-2 transition ${
                selectedReport === type.value
                  ? 'bg-blue-50 border-blue-500'
                  : 'bg-white border-gray-200'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <Button onClick={generateReport} disabled={loading}>
          {loading ? <Loader className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
          Gerar Relatório
        </Button>
      </Card>

      {error && <Card className="p-4 bg-red-50"><p className="text-red-600">{error}</p></Card>}

      {reportData && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold">Resultados</h2>
            <Button onClick={exportToCSV} variant="outline" size="sm">Exportar CSV</Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(reportData.summary).map(([key, value]) => (
              <div key={key} className="bg-white p-3 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-600">{key}</p>
                <p className="text-xl font-bold">{value}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
