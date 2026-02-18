'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface SearchAnalytics {
  period: string;
  totalSearches: number;
  avgSearchTime: number;
  maxSearchTime: number;
  topSearches: Array<{ query: string; searches: number; avgResults: number }>;
  topFilters: Array<{ filter: string; count: number }>;
}

export default function SearchAnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [analytics, setAnalytics] = useState<SearchAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }

    // Check role
    if (!['admin', 'head'].includes(session.user.role)) {
      router.push('/dashboard');
      return;
    }

    fetchAnalytics();
  }, [status, session, timeRange, router]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/analytics/search?time_range=${timeRange}`);
      if (!res.ok) throw new Error('Failed to fetch analytics');

      const data = await res.json();
      setAnalytics(data.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8 text-gray-600">
        Nenhum dado de analytics disponível
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Analytics de Busca
        </h1>
        <p className="text-gray-600">
          Análise de uso e performance do sistema de busca
        </p>
      </div>

      {/* Time Range Selector */}
      <div className="mb-6 flex gap-2">
        {['7', '30', '90'].map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              timeRange === range
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Últimos {range} dias
          </button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-semibold uppercase mb-2">
            Total de Buscas
          </p>
          <p className="text-3xl font-bold text-gray-900">
            {analytics.totalSearches}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-semibold uppercase mb-2">
            Tempo Médio
          </p>
          <p className="text-3xl font-bold text-gray-900">
            {analytics.avgSearchTime}ms
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-semibold uppercase mb-2">
            Tempo Máximo
          </p>
          <p className="text-3xl font-bold text-gray-900">
            {analytics.maxSearchTime}ms
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-semibold uppercase mb-2">
            Período
          </p>
          <p className="text-lg font-bold text-gray-900">
            {analytics.period}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Searches */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            🔍 Top Buscas
          </h2>
          <div className="space-y-3">
            {analytics.topSearches.length === 0 ? (
              <p className="text-gray-600 text-sm">Nenhuma busca registrada</p>
            ) : (
              analytics.topSearches.map((search, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-gray-900 truncate">
                      {search.query}
                    </p>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-semibold">
                      {search.searches}x
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">
                    ~{search.avgResults} resultados em média
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Filters */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            ⚙️ Filtros Mais Usados
          </h2>
          <div className="space-y-3">
            {analytics.topFilters.length === 0 ? (
              <p className="text-gray-600 text-sm">Nenhum filtro registrado</p>
            ) : (
              analytics.topFilters.map((filter, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-900">
                      {filter.filter}
                    </p>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: `${(filter.count / analytics.totalSearches) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-900 ml-2">
                      {filter.count}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-3">
          📊 Insights de Performance
        </h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>
            ✓ Tempo médio de busca:{' '}
            <span className="font-semibold">{analytics.avgSearchTime}ms</span>
            {analytics.avgSearchTime < 200 && (
              <span className="ml-2 text-green-600">(Excelente)</span>
            )}
            {analytics.avgSearchTime >= 200 && analytics.avgSearchTime < 500 && (
              <span className="ml-2 text-yellow-600">(Bom)</span>
            )}
            {analytics.avgSearchTime >= 500 && (
              <span className="ml-2 text-red-600">(Precisa Otimização)</span>
            )}
          </li>
          <li>
            ✓ Consulta mais usada:{' '}
            <span className="font-semibold">
              &quot;{analytics.topSearches[0]?.query || 'N/A'}&quot;
            </span>
          </li>
          <li>
            ✓ Filtro mais popular:{' '}
            <span className="font-semibold">
              {analytics.topFilters[0]?.filter || 'N/A'}
            </span>
          </li>
          <li>
            ✓ Total de buscas no período:{' '}
            <span className="font-semibold">{analytics.totalSearches}</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
