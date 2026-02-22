'use client';

import { useState } from 'react';
import ChatInterface from '../../../../components/marketplace/ChatInterface';
import AgentStatusPanel from '../../../../components/marketplace/AgentStatusPanel';

export default function MarketplaceChatPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleRunAutonomousLoop = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/marketplace/autonomous/run', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Erro ao executar loop autônomo');
      }

      const data = await response.json();
      console.log('Loop execution result:', data);
      alert(`✅ Loop executado com sucesso!\n${data.summary}`);
    } catch (error) {
      console.error('Error running autonomous loop:', error);
      alert(`❌ Erro ao executar loop: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen gap-0">
      {/* Sidebar com status dos agentes */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
        <AgentStatusPanel onRunLoop={handleRunAutonomousLoop} isLoading={isLoading} />
      </div>

      {/* Área principal de chat */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex flex-col overflow-hidden">
          <ChatInterface />
        </div>
      </div>
    </div>
  );
}
