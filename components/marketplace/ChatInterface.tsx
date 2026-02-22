'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  agents?: string[];
}

interface CreatedTask {
  title: string;
  description: string;
  channel: string;
  priority: 'low' | 'medium' | 'high';
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '👋 Olá! Sou Nexo, o Marketplace Master especializado em Moda Bebê e Infantil. Como posso ajudar você a otimizar suas estratégias de e-commerce?',
      agents: ['nexo'],
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [createdTasks, setCreatedTasks] = useState<CreatedTask[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: input,
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Create EventSource for SSE
      const formattedHistory = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch('/api/marketplace/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          conversationHistory: formattedHistory,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao obter resposta dos agentes');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Sem response body');
      }

      let fullContent = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));

            if (data.type === 'done') {
              // Finished streaming
              setMessages(prev => [
                ...prev,
                {
                  role: 'assistant',
                  content: fullContent,
                  agents: ['nexo'],
                },
              ]);
              fullContent = '';
            } else if (data.type === 'tasks_created' && data.tasks?.length > 0) {
              // Tasks were created
              setCreatedTasks(data.tasks);
              // Auto-hide notification after 8 seconds
              setTimeout(() => setCreatedTasks([]), 8000);
            } else if (data.type === 'error') {
              throw new Error(data.error);
            } else if (data.text) {
              fullContent += data.text;
              // Update last message in real-time
              setMessages(prev => {
                const lastMsg = prev[prev.length - 1];
                if (lastMsg?.role === 'assistant') {
                  return [
                    ...prev.slice(0, -1),
                    { ...lastMsg, content: fullContent },
                  ];
                }
                return prev;
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
          agents: [],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    { label: '👶 SEO Amazon Bebê', message: 'Crie tarefas de SEO para Amazon em moda bebê e infantil com foco em INMETRO e body' },
    { label: '🏪 Auditoria MercadoLivre', message: 'Quero auditar meu desempenho no MercadoLivre para roupas infantis - crie tarefas de melhoria' },
    { label: '🎥 Conteúdo Shopee', message: 'Crie tarefas de conteúdo de vídeo para Shopee em moda infantil com foco em flat lay e unboxing' },
    { label: '⚡ Quick wins hoje', message: 'Quais são as quick wins de hoje para moda bebê e infantil? Crie tarefas para as 3 melhores oportunidades' },
  ];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Chat Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 p-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          💬 Chat com Nexo
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Marketplace Master - Squad de 6 agentes especializados
        </p>
      </div>

      {/* Tasks Created Notification */}
      {createdTasks.length > 0 && (
        <div className="border-b border-green-200 bg-green-50 dark:bg-green-950 p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-green-600 dark:text-green-400 font-semibold">
                  ✅ {createdTasks.length} tarefa(s) criada(s)
                </span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                Tarefas aguardando aprovação:
              </p>
              <div className="space-y-2">
                {createdTasks.map((task, idx) => (
                  <div key={idx} className="text-sm text-green-700 dark:text-green-300 bg-white dark:bg-gray-800 p-2 rounded border border-green-200 dark:border-green-700">
                    <span className="font-medium">{task.title}</span>
                    <span className="text-xs ml-2 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded">
                      {task.channel}
                    </span>
                  </div>
                ))}
              </div>
              <Link
                href="/marketplace/tasks?status=pending"
                className="text-sm text-green-600 dark:text-green-400 hover:underline mt-2 inline-block"
              >
                Ver tarefas →
              </Link>
            </div>
            <button
              onClick={() => setCreatedTasks([])}
              className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 ml-2"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 1 && (
          <div className="space-y-3">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Escolha uma ação rápida ou comece uma conversa:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {quickActions.map((action, i) => (
                <Button
                  key={i}
                  variant="outline"
                  className="justify-start text-left h-auto py-3"
                  onClick={() => {
                    setInput(action.message);
                    setTimeout(() => {
                      handleSendMessage();
                    }, 0);
                  }}
                >
                  <span>{action.label}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-md lg:max-w-2xl px-4 py-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white rounded-br-none'
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-none'
              }`}
            >
              <div className="text-sm whitespace-pre-wrap break-words">
                {message.content}
              </div>
              {message.agents && message.agents.length > 0 && (
                <div className="text-xs mt-2 opacity-70">
                  {message.agents.map(agent => (
                    <span key={agent} className="inline-block mr-2">
                      @{agent}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 dark:bg-gray-800 px-4 py-3 rounded-lg rounded-bl-none">
              <Loader2 className="w-5 h-5 animate-spin text-gray-600 dark:text-gray-400" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-gray-800 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Pergunte qualquer coisa aos agentes..."
            className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className="bg-blue-500 hover:bg-blue-600"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Pressione Enter para enviar • Shift+Enter para quebra de linha
        </p>
      </div>
    </div>
  );
}
