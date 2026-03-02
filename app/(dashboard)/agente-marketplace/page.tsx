'use client';

import { useEffect, useState } from 'react';
import { getSession } from 'next-auth/react';
import type { Session } from 'next-auth';
import { useRouter } from 'next/navigation';
import { Bot, BarChart3, ShoppingCart, Zap } from 'lucide-react';

interface SubAgent {
  id: string;
  name: string;
  status: 'ativo' | 'inativo';
  tasks: number;
  lastRun: string;
}

export default function AgenteMarketplacePage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [subAgents] = useState<SubAgent[]>([
    {
      id: '1',
      name: 'Shopee Sync Agent',
      status: 'ativo',
      tasks: 12,
      lastRun: '2 minutos atrás',
    },
    {
      id: '2',
      name: 'Shein Catalog Agent',
      status: 'ativo',
      tasks: 8,
      lastRun: '5 minutos atrás',
    },
    {
      id: '3',
      name: 'Mercado Livre Pricing Agent',
      status: 'ativo',
      tasks: 15,
      lastRun: '1 minuto atrás',
    },
    {
      id: '4',
      name: 'Inventory Manager Agent',
      status: 'ativo',
      tasks: 5,
      lastRun: '10 minutos atrás',
    },
  ]);

  useEffect(() => {
    const checkAuth = async () => {
      const userSession = await getSession();
      if (!userSession) {
        router.push('/login');
        return;
      }
      setSession(userSession);
      setLoading(false);
    };
    checkAuth();
  }, [router]);

  if (loading) {
    return <div className="p-8">Carregando...</div>;
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Bot className="w-8 h-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-gray-900">Agente Marketplace Master</h1>
        </div>
        <p className="text-gray-600">Controle todos os sub-agentes de marketplace em tempo real</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sub-Agentes Ativos</p>
              <p className="text-3xl font-bold text-gray-900">4</p>
            </div>
            <Bot className="w-10 h-10 text-purple-200" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tarefas Executadas</p>
              <p className="text-3xl font-bold text-gray-900">40</p>
            </div>
            <Zap className="w-10 h-10 text-yellow-200" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Taxa de Sucesso</p>
              <p className="text-3xl font-bold text-green-600">98%</p>
            </div>
            <BarChart3 className="w-10 h-10 text-green-200" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Próxima Execução</p>
              <p className="text-lg font-bold text-gray-900">2 min</p>
            </div>
            <ShoppingCart className="w-10 h-10 text-blue-200" />
          </div>
        </div>
      </div>

      {/* Sub-Agents List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Sub-Agentes</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Nome</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Tarefas</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Última Execução</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Ações</th>
              </tr>
            </thead>
            <tbody>
              {subAgents.map((agent) => (
                <tr key={agent.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <Bot className="w-5 h-5 text-purple-600" />
                      <span className="font-medium text-gray-900">{agent.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      ✓ {agent.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-gray-900 font-medium">{agent.tasks}</span>
                  </td>
                  <td className="py-3 px-4 text-gray-600 text-sm">{agent.lastRun}</td>
                  <td className="py-3 px-4">
                    <button className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition font-medium">
                      Detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Logs */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Últimas Execuções</h2>
        
        <div className="space-y-3 bg-gray-50 rounded-lg p-4 font-mono text-sm text-gray-600 max-h-64 overflow-y-auto">
          <div>14:35:22 - [Shopee Sync] Sincronizando 45 produtos</div>
          <div>14:34:15 - [Mercado Livre] Atualizando preços de 28 itens</div>
          <div>14:33:08 - [Shein Catalog] Importando novas categorias</div>
          <div>14:32:01 - [Inventory] Verificando estoque disponível</div>
          <div>14:30:45 - [Shopee Sync] Processamento concluído com sucesso</div>
          <div>14:29:30 - [Marketplace] Iniciando ciclo de sincronização</div>
          <div className="text-green-600">✓ Todas as operações funcionando normalmente</div>
        </div>
      </div>
    </div>
  );
}
